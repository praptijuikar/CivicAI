import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import crypto from "crypto";
import bcrypt from "bcryptjs";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import path from "path";
import { createServer as createViteServer } from "vite";
import { analyzeCivicImage, fallbackCVAnalysis } from "./server/gemini.ts";
import { validateUploadedImage } from "./server/imageValidation.ts";
import { ComplaintQueue, type ComplaintQueueJob } from "./server/complaintQueue.ts";
import { calculateBudgetAllocation, estimateRepairCost } from "./server/budgetOptimizer.ts";
import { sendComplaintConfirmation } from "./server/services/emailService.ts";
import {
  db,
  USERS,
  DEPARTMENTS,
  generateSHA256Hash,
  normalizeComplaintText,
  computePriorityScore,
  createComplaintQueryHash,
  syncWithFirebase,
  seedDefaultAdmin,
} from "./server/db.ts";
import type { AIAnalysisResult, CivicIssue, Language, Severity, User } from "./src/types.ts";

const AUTH_SECRET = process.env.AUTH_SECRET || "civicai-development-secret-change-me";
const AUTH_SESSION_TTL_SECONDS = 8 * 60 * 60;
// DEMO ADMIN LOGIN - REPLACE WITH SECURE AUTH BEFORE PRODUCTION
const DEMO_ADMIN_ID = "prapti.j";
const DEMO_ADMIN_PASSWORD = "Scram440";
const DEMO_ADMIN_PASSWORD_HASH = bcrypt.hashSync(DEMO_ADMIN_PASSWORD, 12);
const MUNICIPAL_BOUNDARY = {
  minLatitude: Number(process.env.MUNICIPAL_MIN_LATITUDE) || 37.70,
  maxLatitude: Number(process.env.MUNICIPAL_MAX_LATITUDE) || 37.84,
  minLongitude: Number(process.env.MUNICIPAL_MIN_LONGITUDE) || -122.55,
  maxLongitude: Number(process.env.MUNICIPAL_MAX_LONGITUDE) || -122.35,
};
const LOW_REPUTATION_THRESHOLD = Number(process.env.LOW_REPUTATION_THRESHOLD) || 50;
const submissionTimestamps = new Map<string, number[]>();
const mediaChunks = new Map<string, { totalChunks: number; chunks: Map<number, string> }>();
const SUBMISSION_WINDOW_MS = 24 * 60 * 60 * 1000;
const SUBMISSIONS_PER_WINDOW = 3;
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || "municipality-sf";
const PUBLIC_USER: User = {
  id: "public-anonymous",
  name: "Civic Resident",
  email: "",
  role: "citizen",
  tenantId: DEFAULT_TENANT_ID,
  reputationScore: 100,
  createdAt: "",
};

function getClientIp(req: express.Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function submissionThrottle(req: express.Request, res: express.Response, next: express.NextFunction) {
  const now = Date.now();
  const keys = [`ip:${getClientIp(req)}`, `user:${res.locals.user.id}`];
  const recentByKey = keys.map((key) => ({
    key,
    timestamps: (submissionTimestamps.get(key) || []).filter((time) => now - time < SUBMISSION_WINDOW_MS),
  }));
  const limitedKey = recentByKey.find(({ timestamps }) => timestamps.length >= SUBMISSIONS_PER_WINDOW);
  if (limitedKey) {
    const retryAfter = Math.ceil((Math.min(...limitedKey.timestamps) + SUBMISSION_WINDOW_MS - now) / 1000);
    return res.status(429).json({ error: "Submission limit reached", message: "You can submit at most 3 complaints per 24 hours.", retryAfterSeconds: retryAfter });
  }
  recentByKey.forEach(({ key, timestamps }) => submissionTimestamps.set(key, [...timestamps, now]));
  next();
}

function isInsideMunicipality(latitude: number, longitude: number): boolean {
  return latitude >= MUNICIPAL_BOUNDARY.minLatitude && latitude <= MUNICIPAL_BOUNDARY.maxLatitude
    && longitude >= MUNICIPAL_BOUNDARY.minLongitude && longitude <= MUNICIPAL_BOUNDARY.maxLongitude;
}
function signSession(userId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + AUTH_SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt })).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function getAuthenticatedUser(req: express.Request) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return undefined;

  const [payload, signature] = authorization.slice(7).split(".");
  if (!payload || !signature) return undefined;
  const expectedSignature = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return undefined;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId?: string; expiresAt?: number };
    if (!session.userId || !session.expiresAt || session.expiresAt <= Math.floor(Date.now() / 1000)) return undefined;
    return USERS.find((user) => user.id === session.userId);
  } catch {
    return undefined;
  }
}

function allowPublicAccess(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthenticatedUser(req);
  res.locals.isAnonymous = !user;
  res.locals.user = user || PUBLIC_USER;
  res.locals.tenantId = user?.tenantId || DEFAULT_TENANT_ID;
  next();
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  res.locals.user = user;
  res.locals.tenantId = user.tenantId || DEFAULT_TENANT_ID;
  next();
}

function requireRole(...roles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = res.locals.user || getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required" });
    if (!roles.includes(user.role)) return res.status(403).json({ error: "Admin access required" });
    res.locals.user = user;
    res.locals.tenantId = user.tenantId || DEFAULT_TENANT_ID;
    next();
  };
}

const aiAnalysisSchema = z.object({
  isValidScene: z.boolean(),
  hasVisibleIssue: z.boolean(),
  primaryIssueDetected: z.string().max(200),
  isCategoryMismatch: z.boolean(),
  isAuthentic: z.boolean(),
  authenticityReasoning: z.string().max(500),
  predictedCategory: z.string().max(200),
  subcategory: z.string().max(200),
  confidence: z.number().finite().min(0).max(1),
  severity: z.enum(["Critical", "High", "Medium", "Low"]),
  calculatedPriorityScore: z.number().finite().min(0).max(100),
  safetyRisks: z.array(z.string().max(500)).max(50),
  recommendedDepartment: z.string().max(200),
  estimatedResolutionHours: z.number().finite().min(0).max(10_000),
  suggestedEquipment: z.array(z.string().max(200)).max(50),
  actionChecklist: z.array(z.string().max(500)).max(50),
  summary: z.string().max(5000),
  rawResponse: z.string().max(10_000).optional(),
  verificationStatus: z.enum(["verified", "needs_review", "no_issue_detected"]),
  sceneRelevance: z.enum(["road_infrastructure", "non_infrastructure", "uncertain"]),
}).strict() satisfies z.ZodType<AIAnalysisResult>;

const issueSchema = z.object({
  title: z.string().trim().min(3).max(200),
  category: z.string().trim().min(1).max(100),
  subcategory: z.string().trim().max(100).optional(),
  description: z.string().trim().min(1).max(5000),
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
  address: z.string().trim().min(1).max(300),
  landmark: z.string().trim().max(200).optional(),
  severity: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  priorityScore: z.coerce.number().finite().min(0).max(100).optional(),
  initialImageUrl: z.string().max(10_000_000).optional(),
  aiAnalysis: aiAnalysisSchema.optional(),
  userId: z.string().trim().min(1).max(100).optional(),
  reporterName: z.string().trim().min(1).max(150).optional(),
  isAnonymous: z.boolean().optional(),
  reporterContact: z.string().trim().max(200).refine(
    (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^\+?[0-9()\s.-]{7,30}$/.test(value),
    "Contact must be a valid email address or phone number"
  ).optional(),
  assignedDepartment: z.string().trim().max(150).optional(),
  deviceTag: z.string().trim().max(100).optional(),
  estimatedRepairCost: z.coerce.number().finite().positive().max(10_000_000).optional(),
  wardTag: z.string().trim().max(100).optional(),
  website: z.string().max(0).optional(),
  clientId: z.string().uuid().optional(),
  sourceLanguage: z.enum(["en", "hi", "bn", "mr", "ta", "te", "gu", "kn", "ml", "pa", "es", "fr", "zh"]).optional(),
}).strict();

type ComplaintPayload = z.infer<typeof issueSchema>;

function persistComplaint(payload: ComplaintPayload, user: User): CivicIssue {
  const tenantId = user.tenantId || DEFAULT_TENANT_ID;
  const existingClientIssue = payload.clientId ? db.getIssueByClientId(payload.clientId, tenantId) : undefined;
  if (existingClientIssue) return existingClientIssue;

  const queryHash = createComplaintQueryHash(payload.title, payload.description);
  const duplicate = db.findRecentDuplicate(user.id, queryHash);
  if (duplicate) throw new Error(`DUPLICATE:${duplicate.id}`);
  if (!isInsideMunicipality(payload.latitude, payload.longitude)) throw new Error("Location outside municipality");

  const effectiveAnalysis = payload.aiAnalysis || fallbackCVAnalysis(`${payload.title} ${payload.description}`);
  return db.createIssue({
    ...payload,
    category: payload.aiAnalysis ? payload.category : effectiveAnalysis.predictedCategory,
    subcategory: payload.subcategory || effectiveAnalysis.subcategory,
    priorityScore: payload.priorityScore || effectiveAnalysis.calculatedPriorityScore,
    aiAnalysis: effectiveAnalysis,
    queryHash,
    tenantId,
    sourceLanguage: payload.sourceLanguage,
    normalizedDescription: normalizeComplaintText(`${payload.title} ${payload.description}`),
    userId: user.id,
    reporterName: user.name,
    assignedDepartment: payload.assignedDepartment || effectiveAnalysis.recommendedDepartment,
    moderationStatus: (user.reputationScore ?? 100) < LOW_REPUTATION_THRESHOLD ? "pending" : "clear",
  });
}

async function startServer() {
  syncWithFirebase();
  await seedDefaultAdmin();
  const app = express();
  const isProduction = process.env.NODE_ENV === "production";
  const PORT = Number(process.env.PORT) || 3000;
  const configuredOrigins = process.env.CORS_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const trustedOrigins = configuredOrigins?.length
    ? configuredOrigins
    : isProduction
      ? [process.env.APP_URL || "https://civic-ai-prapti3.vercel.app"]
      : ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"];
  const isLocalDevelopmentOrigin = (origin: string) =>
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
  const maxRequests = Number(process.env.RATE_LIMIT_MAX) || 100;
  const issueMaxRequests = Number(process.env.ISSUE_RATE_LIMIT_MAX) || 20;
  const bodyLimit = process.env.BODY_LIMIT || "10mb";
  const asyncComplaints = process.env.ASYNC_COMPLAINTS === "true";
  const complaintQueue = new ComplaintQueue<ComplaintPayload>({
    maxSize: Number(process.env.COMPLAINT_QUEUE_MAX) || 50_000,
    concurrency: Number(process.env.COMPLAINT_QUEUE_CONCURRENCY) || 4,
    process: async (job: ComplaintQueueJob<ComplaintPayload>) => {
      const user = db.getUserById(job.userId);
      if (!user) throw new Error("Authenticated user no longer exists");
      const issue = persistComplaint(job.payload, user);
      return { issueId: issue.id };
    },
  });

  app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : 0);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:", "http://localhost:*", "http://127.0.0.1:*", "ws://localhost:*", "ws://127.0.0.1:*"]
      }
    }
  }));
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || trustedOrigins.includes(origin) || (!isProduction && isLocalDevelopmentOrigin(origin))) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  }));
  app.use("/api", rateLimit({
    windowMs,
    limit: maxRequests,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
  }));

  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

  // Request logger for API calls
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // ==========================================
  // AUTH & USERS
  // ==========================================
  app.post("/api/v1/auth/register", (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    
    // Check if user exists
    const existing = USERS.find((u) => u.email === email);
    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Generate internal ID
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    const newId = `USR-${year}-${rand}`;

    const newUser: User = {
      id: newId,
      name,
      email,
      phone: phone || "",
      role: "citizen",
      tenantId: DEFAULT_TENANT_ID,
      reputationScore: 100,
      createdAt: new Date().toISOString(),
      passwordHash: bcrypt.hashSync(password, 10), // We store this purely in memory for this demo
    };

    USERS.push(newUser);
    
    res.status(201).json({
      token: signSession(newUser.id),
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  });

  app.post("/api/v1/auth/login", (req, res) => {
    const { phone, otp, email, password } = req.body;
    
    // Legacy support for admin
    if (email === DEMO_ADMIN_ID && bcrypt.compareSync(password || "", DEMO_ADMIN_PASSWORD_HASH)) {
      const admin = USERS.find((u) => u.role === "admin");
      if (admin) {
        return res.json({ token: signSession(admin.id), user: admin });
      }
    }

    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone and OTP required" });
    }

    // OTP Simulation: Accept any 6 digit OTP for the phone number
    if (otp.length !== 6) {
      return res.status(401).json({ error: "Invalid OTP format. Must be 6 digits." });
    }

    let user = USERS.find((u) => u.phone === phone);
    if (!user) {
      // Auto-register citizen on first OTP login
      const year = new Date().getFullYear();
      const rand = Math.floor(10000 + Math.random() * 90000);
      user = {
        id: `USR-${year}-${rand}`,
        name: "Civic Resident",
        email: "",
        phone: phone,
        role: "citizen",
        tenantId: DEFAULT_TENANT_ID,
        reputationScore: 100,
        createdAt: new Date().toISOString(),
      };
      USERS.push(user);
    }

    res.json({
      token: signSession(user.id),
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role }
    });
  });

  app.get("/api/v1/auth/me", requireAuth, (req, res) => {
    const user = res.locals.user;
    res.json({ user });
  });

  // ==========================================
  // DEPARTMENTS & OFFICERS
  // ==========================================
  app.get("/api/v1/departments", (req, res) => {
    res.json({ departments: DEPARTMENTS });
  });

  app.get("/api/v1/platform/capabilities", (req, res) => {
    res.json({
      tenantIsolation: true,
      supportedLanguages: ["en", "hi", "bn", "mr", "ta", "te", "gu", "kn", "ml", "pa"],
      sourceLanguageMetadata: true,
      offlineSync: true,
      federatedIdentity: process.env.OIDC_ISSUER_URL ? "configured" : "not-configured",
      federatedIdentityConfiguration: "Set OIDC_ISSUER_URL and OIDC_CLIENT_ID to enable an external OIDC broker.",
    });
  });

  app.get("/api/v1/public/transparency", (req, res) => {
    const issues = db.getIssues();
    const byStatus = issues.reduce<Record<string, number>>((counts, issue) => {
      counts[issue.status] = (counts[issue.status] || 0) + 1;
      return counts;
    }, {});
    const byCategory = issues.reduce<Record<string, number>>((counts, issue) => {
      counts[issue.category] = (counts[issue.category] || 0) + 1;
      return counts;
    }, {});
    res.json({
      generatedAt: new Date().toISOString(),
      totalComplaints: issues.length,
      averageResolutionHours: 0,
      byStatus,
      byCategory,
      activeIssueLocations: issues.filter((issue) => !["resolved", "verified"].includes(issue.status)).map((issue) => ({
        latitude: issue.latitude,
        longitude: issue.longitude,
        category: issue.category,
      })),
    });
  });

  app.get("/api/v1/audit/logs", requireAuth, requireRole("admin"), (req, res) => {
    res.json({ entries: db.getAuditEntries(), integrity: db.verifyAuditChain() });
  });

  app.get("/api/v1/officers", (req, res) => {
    const officers = USERS.filter((u) => u.role === "officer");
    res.json({ officers });
  });

  // ==========================================
  // CIVIC ISSUES APIS
  // ==========================================
  app.get("/api/v1/issues", allowPublicAccess, (req, res) => {
    const { status, category, department, severity, search, userId } = req.query;
    const requestingUser = res.locals.user;
    const issues = db.getIssues({
      status: status as string,
      category: category as string,
      department: department as string,
      severity: severity as string,
      search: search as string,
      userId: requestingUser.role === "citizen" && !res.locals.isAnonymous ? requestingUser.id : userId as string,
      tenantId: res.locals.tenantId,
    });
    res.json({ issues, total: issues.length });
  });

  app.get("/api/v1/issues/systemic-groups", requireAuth, requireRole("admin"), (req, res) => {
    const requestedDays = Number(req.query.days);
    const days = Number.isFinite(requestedDays) ? Math.min(Math.max(requestedDays, 1), 30) : 7;
    res.json({ groups: db.getSystemicIssueGroups(days * 24 * 60 * 60 * 1000, res.locals.tenantId), days });
  });

  app.post("/api/v1/ai/analyze-image", allowPublicAccess, async (req, res) => {
    try {
      const { image, categoryContext } = req.body;
      if (!image) return res.status(400).json({ error: "Image is required" });

      // Clean base64
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      const validation = await validateUploadedImage(buffer);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.reason });
      }

      const aiResult = await analyzeCivicImage(
        base64Data,
        "image/jpeg",
        categoryContext ? `User selected category: ${categoryContext}` : undefined
      );
      
      res.json({ analysis: aiResult });
    } catch (err: any) {
      console.error("AI Analysis route error:", err);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  app.post("/api/v1/budget/allocate", requireAuth, requireRole("admin"), (req, res) => {
    const budgetCap = Number(req.body.budgetCap);
    if (!Number.isFinite(budgetCap) || budgetCap <= 0 || budgetCap > 1_000_000_000) {
      return res.status(400).json({ error: "budgetCap must be a positive amount below 1 billion" });
    }
    const crisisMode = Boolean(req.body.crisisMode);
    const crisisCategories = Array.isArray(req.body.crisisCategories)
      ? req.body.crisisCategories.filter((value: unknown): value is string => typeof value === "string")
      : ["Water & Sewage", "Sanitation & Waste"];
    const neglectedWards = Array.isArray(req.body.neglectedWards)
      ? req.body.neglectedWards.filter((value: unknown): value is string => typeof value === "string")
      : [];
    const allocation = calculateBudgetAllocation(db.getIssues({ tenantId: res.locals.tenantId }), {
      budgetCap,
      crisisMode,
      crisisCategories,
      neglectedWards,
      wardOf: (issue) => issue.wardTag || issue.address,
      costOf: estimateRepairCost,
    });
    res.json({ allocation });
  });

  app.get("/api/v1/issues/queue/:token", requireAuth, (req, res) => {
    const job = complaintQueue.get(req.params.token);
    if (!job || (job.userId !== res.locals.user.id && res.locals.user.role !== "admin")) {
      return res.status(404).json({ error: "Queue item not found" });
    }
    res.json({ status: job.status, confirmationToken: job.token, issueId: job.issueId, error: job.error, updatedAt: job.updatedAt });
  });

  app.get("/api/v1/issues/:id", allowPublicAccess, (req, res) => {
    const requestingUser = res.locals.user;
    const issue = db.getIssueById(req.params.id, res.locals.tenantId);

    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    if (requestingUser.role === "citizen" && !res.locals.isAnonymous && issue.userId !== requestingUser.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ issue });
  });

  app.post("/api/v1/issues/analyze-image", allowPublicAccess, async (req, res) => {
    try {
      const { imageBase64, mimeType, description } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64 payload" });
      }

      // Decode base64 and validate the image before sending to AI
      const cleanBase64 = typeof imageBase64 === "string" && imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;

      let imageBuffer: Buffer;
      try {
        imageBuffer = Buffer.from(cleanBase64, "base64");
      } catch {
        return res.status(422).json({
          success: false,
          type: "INVALID_IMAGE",
          message: "Unable to decode image data. Please upload a valid photo.",
        });
      }

      // Server-side validation gate — reject bad images BEFORE AI
      const validation = await validateUploadedImage(imageBuffer);
      if (!validation.valid) {
        return res.status(422).json({
          success: false,
          type: "INVALID_IMAGE",
          message: validation.reason,
          brightness: validation.brightness,
          contrast: validation.contrast,
        });
      }

      // Image passed validation — send to AI
      const analysis = await analyzeCivicImage(imageBase64, mimeType || "image/jpeg", description);

      // Scene relevance gate — reject non-infrastructure images
      if (analysis.sceneRelevance === "non_infrastructure") {
        return res.status(422).json({
          success: false,
          type: "NON_INFRASTRUCTURE",
          message: "This image does not appear to show a road or public infrastructure issue. Please upload a photo of the civic problem.",
          analysis,
        });
      }

      res.json({ analysis });
    } catch (err: any) {
      console.error("Image analysis endpoint error:", err);
      res.status(500).json({ error: "AI analysis failed", details: err.message });
    }
  });

  app.post("/api/v1/issues/duplicate-check", allowPublicAccess, (req, res) => {
    const { latitude, longitude, category, radiusMeters } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    const duplicates = db.checkDuplicates(
      Number(latitude),
      Number(longitude),
      category,
      radiusMeters ? Number(radiusMeters) : 80
    );

    res.json({
      hasDuplicates: duplicates.length > 0,
      count: duplicates.length,
      duplicates,
    });
  });

  app.post("/api/v1/issues", rateLimit({
    windowMs,
    limit: issueMaxRequests,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many issue submissions. Please try again later." },
  }), allowPublicAccess, submissionThrottle, (req, res) => {
    try {
      if (typeof req.body.website === "string" && req.body.website.length > 0) {
        return res.status(400).json({ error: "Automated submission detected" });
      }
      const parsed = issueSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid issue payload",
          details: parsed.error.flatten().fieldErrors,
        });
      }
      const user = res.locals.user as User;
      if (asyncComplaints) {
        const queued = complaintQueue.enqueue(user.id, parsed.data);
        if (!queued) return res.status(503).json({ error: "Complaint queue is full", message: "Please retry shortly." });
        return res.status(202).json({
          status: "queued",
          confirmationToken: queued.token,
          message: "Complaint received and queued for processing.",
        });
      }

      try {
        const created = persistComplaint(parsed.data, user);
        res.status(201).json({ issue: created, message: "Issue submitted successfully" });
        
        sendComplaintConfirmation({
          email: user.email,
          userName: user.name,
          complaintId: created.id,
          issueType: created.category,
          location: created.address || `Lat: ${created.latitude}, Lng: ${created.longitude}`,
          description: created.description,
          confidence: created.aiAnalysis?.confidence,
          submittedAt: created.createdAt,
        }).catch((error) => {
          console.error("Email notification failed:", error);
        });
        
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Complaint processing failed";
        if (message.startsWith("DUPLICATE:")) {
          return res.status(409).json({
            error: "Duplicate complaint",
            message: "It looks like you already submitted an identical complaint in the last 24 hours.",
            existingIssueId: message.slice("DUPLICATE:".length),
          });
        }
        if (message === "Location outside municipality") {
          return res.status(422).json({ error: "Location outside municipality", message: "Please provide GPS coordinates within the municipal boundary." });
        }
        throw error;
      }
    } catch (err: any) {
      console.error("Create issue error:", err);
      res.status(500).json({ error: "Failed to create civic issue", details: err.message });
    }
  });

  app.delete("/api/v1/issues/:id", requireAuth, requireRole("admin"), (req, res) => {
    const issue = db.deleteIssue(req.params.id, res.locals.user.id, res.locals.tenantId);
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    res.json({ message: "Complaint deleted and recorded in the audit ledger.", issueId: issue.id });
  });

  app.post("/api/v1/issues/:id/media/chunks", allowPublicAccess, (req, res) => {
    const issue = db.getIssueById(req.params.id, res.locals.tenantId);
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    if (res.locals.user.role === "citizen" && !res.locals.isAnonymous && issue.userId !== res.locals.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    const { chunkIndex, totalChunks, data } = req.body as { chunkIndex?: number; totalChunks?: number; data?: string };
    if (typeof chunkIndex !== "number" || typeof totalChunks !== "number" || !data || !Number.isInteger(chunkIndex) || !Number.isInteger(totalChunks) || chunkIndex < 0 || totalChunks < 1 || chunkIndex >= totalChunks) {
      return res.status(400).json({ error: "Invalid media chunk" });
    }
    const upload = mediaChunks.get(issue.id) || { totalChunks, chunks: new Map<number, string>() };
    if (upload.totalChunks !== totalChunks) return res.status(409).json({ error: "Media upload metadata conflict" });
    upload.chunks.set(chunkIndex, data);
    mediaChunks.set(issue.id, upload);
    if (upload.chunks.size !== totalChunks) return res.json({ complete: false });
    const media = Array.from({ length: totalChunks }, (_, index) => upload.chunks.get(index)).join("");
    const updated = db.updateIssue(issue.id, { initialImageUrl: media, beforeImageUrl: media }, res.locals.user.id);
    mediaChunks.delete(issue.id);
    res.json({ complete: true, issue: updated });
  });

  app.patch("/api/v1/issues/:id/moderation", requireAuth, requireRole("admin"), (req, res) => {
    const status = req.body.status;
    if (status !== "spam" && status !== "fake" && status !== "clear") {
      return res.status(400).json({ error: "Moderation status must be spam, fake, or clear" });
    }
    if (!db.getIssueById(req.params.id, res.locals.tenantId)) return res.status(404).json({ error: "Issue not found" });
    if (status !== "clear") {
      const approvalId = typeof req.body.approvalId === "string" ? req.body.approvalId : undefined;
      if (!approvalId) {
        const approval = db.requestApproval(req.params.id, `moderation:${status}`, res.locals.user.id);
        return res.status(202).json({ status: "awaiting_second_approval", approvalId: approval.id, message: "A second independent admin must approve this moderation action." });
      }
      const approval = db.approveRequest(approvalId, res.locals.user.id);
      if (approval === "same-actor") return res.status(403).json({ error: "A second independent admin is required" });
      if (!approval || approval.resourceId !== req.params.id || approval.action !== `moderation:${status}`) {
        return res.status(409).json({ error: "Invalid or expired moderation approval" });
      }
    }
    const issue = db.markIssueModeration(req.params.id, status, res.locals.user.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    res.json({ issue, user: db.getUserById(issue.userId), message: `Complaint marked ${status}.` });
  });

  app.post("/api/v1/issues/:id/upvote", allowPublicAccess, (req, res) => {
    const issue = db.upvoteIssue(req.params.id, res.locals.user.id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }
    res.json({ issue, message: "+1 Upvote recorded. Urgency boosted." });
  });

  app.patch("/api/v1/issues/:id/status", requireAuth, requireRole("admin", "officer"), (req, res) => {
    const { status, notes } = req.body;
    const issue = db.getIssueById(req.params.id, res.locals.tenantId);
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    const now = new Date().toISOString();
    const historyEntry = {
      id: `hist-${Date.now()}`,
      timestamp: now,
      action: `Status changed to ${status}`,
      actorName: res.locals.user.name || "Admin",
      actorRole: res.locals.user.role,
      details: notes || "Status updated.",
    };

    const updatePayload: any = {
      status,
      history: [...issue.history, historyEntry],
    };

    if (status === "escalated") {
      updatePayload.priorityScore = Math.min(100, issue.priorityScore + 20);
    } else if (status === "resolved") {
      updatePayload.resolvedAt = now;
      updatePayload.resolutionNotes = notes;
    }

    const updated = db.updateIssue(req.params.id, updatePayload, res.locals.user.id);
    res.json({ issue: updated, message: `Issue status updated to ${status}` });
  });



  // ==========================================
  // CIVIC INTEGRITY / CONFIDENTIAL VAULT APIS
  // ==========================================
  app.get("/api/v1/integrity-reports", requireAuth, requireRole("admin"), (req, res) => {
    const reports = db.getIntegrityReports();
    res.json({ reports, count: reports.length });
  });

  app.post("/api/v1/integrity-reports", allowPublicAccess, (req, res) => {
    try {
      const {
        category,
        title,
        description,
        departmentInvolved,
        suspectedPersonnel,
        latitude,
        longitude,
        address,
        evidenceFiles,
        capturedAt,
      } = req.body;

      const newReport = db.createIntegrityReport({
        category,
        title,
        description,
        departmentInvolved,
        suspectedPersonnel,
        latitude: Number(latitude) || 37.7749,
        longitude: Number(longitude) || -122.4194,
        address,
        evidenceFiles,
        capturedAt,
      });

      res.status(201).json({
        report: newReport,
        trackingCode: newReport.trackingCode,
        sha256MasterHash: newReport.sha256MasterHash,
        message: "Evidence securely encrypted and ingested into Public Integrity Vault.",
      });
    } catch (err: any) {
      console.error("Integrity report creation error:", err);
      res.status(500).json({ error: "Failed to submit integrity report", details: err.message });
    }
  });

  app.patch("/api/v1/integrity-reports/:id", requireAuth, requireRole("admin"), (req, res) => {
    const { status, investigatorNotes, investigatorId, investigatorName, newAuditStep } = req.body;
    const existing = db.getIntegrityReports().find((r) => r.id === req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Integrity report not found" });
    }

    const auditTrail = [...existing.auditTrail];
    if (newAuditStep) {
      auditTrail.push({
        id: `step-${Date.now()}`,
        stepName: newAuditStep.stepName || "Investigator Action",
        timestamp: new Date().toISOString(),
        status: "completed",
        actor: investigatorName || "Inspector Elena Rostova",
        notes: newAuditStep.notes || investigatorNotes,
      });
    }

    const updated = db.updateIntegrityReport(req.params.id, {
      status: status || existing.status,
      investigatorNotes: investigatorNotes || existing.investigatorNotes,
      investigatorId: investigatorId || existing.investigatorId,
      investigatorName: investigatorName || existing.investigatorName,
      auditTrail,
    });

    res.json({ report: updated, message: "Integrity case status updated." });
  });

  // ==========================================
  // ANALYTICS & DECISION SUPPORT APIS
  // ==========================================
  app.get("/api/v1/analytics/overview", requireAuth, requireRole("admin"), (req, res) => {
    const analytics = db.getAnalytics();
    res.json({ analytics });
  });

  // ==========================================
  // VITE & STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const parserError = err as { type?: string; status?: number };
    if (parserError.type === "entity.too.large" || parserError.status === 413) {
      return res.status(413).json({
        error: "Payload Too Large",
        message: `Request body exceeds the ${bodyLimit} limit.`,
      });
    }

    next(err);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CivicAI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});