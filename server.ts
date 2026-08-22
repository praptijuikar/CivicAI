import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { analyzeCivicImage } from "./server/gemini.ts";
import {
  db,
  USERS,
  DEPARTMENTS,
  generateSHA256Hash,
  computePriorityScore,
} from "./server/db.ts";
import type { Severity } from "./src/types.ts";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Allowed origins (Vercel production URL + local dev)
  const allowedOrigins = [
    "https://civic-ai-prapti3.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  // Enable CORS middleware with explicitly permitted origins
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Allow all origins if you prefer open access
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
    })
  );

  // Handle preflight requests
  app.options("*", cors());

  // Middleware for JSON body parsing with large payload limit for base64 images
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

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
  app.get("/api/v1/auth/users", (req, res) => {
    res.json({ users: USERS });
  });

  app.post("/api/v1/auth/login", (req, res) => {
    const { email, role } = req.body;
    let user = USERS.find((u) => u.email === email);
    if (!user && role) {
      user = USERS.find((u) => u.role === role);
    }
    if (!user) {
      user = USERS[0]; // Default to first user
    }
    res.json({
      token: `jwt_civic_mock_${user.id}_${Date.now()}`,
      user,
    });
  });

  app.get("/api/v1/auth/me", (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    const user = USERS.find((u) => u.id === userId) || USERS[0];
    res.json({ user });
  });

  // ==========================================
  // DEPARTMENTS & OFFICERS
  // ==========================================
  app.get("/api/v1/departments", (req, res) => {
    res.json({ departments: DEPARTMENTS });
  });

  app.get("/api/v1/officers", (req, res) => {
    const officers = USERS.filter((u) => u.role === "officer");
    res.json({ officers });
  });

  // ==========================================
  // CIVIC ISSUES APIS
  // ==========================================
  // List issues with filtering, category, severity, search
  app.get("/api/v1/issues", (req, res) => {
    const { status, category, department, severity, search, userId } = req.query;
    const issues = db.getIssues({
      status: status as string,
      category: category as string,
      department: department as string,
      severity: severity as string,
      search: search as string,
      userId: userId as string,
    });
    res.json({ issues, total: issues.length });
  });

  // Single issue by ID
  app.get("/api/v1/issues/:id", (req, res) => {
    const issue = db.getIssueById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: "Civic issue not found" });
    }
    res.json({ issue });
  });

  // AI Visual Verification & Analysis
  app.post("/api/v1/issues/analyze-image", async (req, res) => {
    try {
      const { imageBase64, mimeType, description } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64 payload" });
      }

      const analysis = await analyzeCivicImage(imageBase64, mimeType || "image/jpeg", description);
      res.json({ analysis });
    } catch (err: any) {
      console.error("Image analysis endpoint error:", err);
      res.status(500).json({ error: "AI analysis failed", details: err.message });
    }
  });

  // Duplicate Check (Proximity Search)
  app.post("/api/v1/issues/duplicate-check", (req, res) => {
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

  // Create Issue
  app.post("/api/v1/issues", (req, res) => {
    try {
      const {
        title,
        category,
        subcategory,
        description,
        latitude,
        longitude,
        address,
        landmark,
        severity,
        priorityScore,
        initialImageUrl,
        aiAnalysis,
        userId,
        reporterName,
        isAnonymous,
        reporterContact,
        assignedDepartment,
      } = req.body;

      const created = db.createIssue({
        title,
        category,
        subcategory,
        description,
        latitude: Number(latitude) || 37.7749,
        longitude: Number(longitude) || -122.4194,
        address: address || "City Municipal Zone",
        landmark,
        severity: (severity as Severity) || "Medium",
        priorityScore: priorityScore ? Number(priorityScore) : undefined,
        initialImageUrl,
        beforeImageUrl: initialImageUrl,
        aiAnalysis,
        userId: userId || "usr-citizen-01",
        reporterName: reporterName || "Aria Montgomery",
        isAnonymous: Boolean(isAnonymous),
        reporterContact,
        assignedDepartment: assignedDepartment || "Department of Public Works",
      });

      res.status(201).json({ issue: created, message: "Issue submitted successfully" });
    } catch (err: any) {
      console.error("Create issue error:", err);
      res.status(500).json({ error: "Failed to create civic issue", details: err.message });
    }
  });

  // Upvote / +1 Duplicate Confirm
  app.post("/api/v1/issues/:id/upvote", (req, res) => {
    const { userId } = req.body;
    const issue = db.upvoteIssue(req.params.id, userId || "usr-citizen-01");
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }
    res.json({ issue, message: "+1 Upvote recorded. Urgency boosted." });
  });

  // Assign Issue (Admin)
  app.patch("/api/v1/issues/:id/assign", (req, res) => {
    const { department, officerId, officerName, slaHours, deadlineAt, adminNotes } = req.body;
    const issue = db.getIssueById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const now = new Date().toISOString();
    const calculatedDeadline =
      deadlineAt ||
      new Date(Date.now() + (slaHours ? Number(slaHours) : 24) * 3600 * 1000).toISOString();

    const historyEntry = {
      id: `hist-${Date.now()}`,
      timestamp: now,
      action: "Officer & Department Assigned",
      actorName: "Director Marcus Vance",
      actorRole: "admin" as const,
      details: `Assigned to ${department} (${officerName || "Field Crew"}). SLA: ${slaHours || 24} hours. ${adminNotes ? `Notes: ${adminNotes}` : ""}`,
    };

    const updated = db.updateIssue(req.params.id, {
      status: "assigned",
      assignedDepartment: department || issue.assignedDepartment,
      assignedOfficerId: officerId,
      assignedOfficerName: officerName,
      assignedAt: now,
      deadlineAt: calculatedDeadline,
      slaHours: slaHours ? Number(slaHours) : 24,
      history: [...issue.history, historyEntry],
    });

    res.json({ issue: updated, message: "Field officer successfully assigned" });
  });

  // Field Officer Work Status Transition (Start Work / In Progress)
  app.patch("/api/v1/issues/:id/start-work", (req, res) => {
    const { officerName, beforeImageUrl } = req.body;
    const issue = db.getIssueById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const now = new Date().toISOString();
    const historyEntry = {
      id: `hist-${Date.now()}`,
      timestamp: now,
      action: "Field Work Commenced",
      actorName: officerName || issue.assignedOfficerName || "Field Officer",
      actorRole: "officer" as const,
      details: "Officer arrived on site and initiated structural remediation.",
    };

    const updated = db.updateIssue(req.params.id, {
      status: "in_progress",
      beforeImageUrl: beforeImageUrl || issue.beforeImageUrl,
      history: [...issue.history, historyEntry],
    });

    res.json({ issue: updated, message: "Issue marked in progress" });
  });

  // Field Officer Submit Resolution
  app.post("/api/v1/issues/:id/resolve", (req, res) => {
    const { officerId, officerName, notes, afterImageUrl, materialsUsed } = req.body;
    const issue = db.getIssueById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const now = new Date().toISOString();
    const historyEntry = {
      id: `hist-${Date.now()}`,
      timestamp: now,
      action: "Resolved & Inspected by Officer",
      actorName: officerName || issue.assignedOfficerName || "Officer Sarah Chen",
      actorRole: "officer" as const,
      details: `Resolution completed: ${notes || "Standard repairs enacted."} Uploaded After Photo. Awaiting citizen verification.`,
    };

    const updated = db.updateIssue(req.params.id, {
      status: "resolved",
      resolvedAt: now,
      resolvedByOfficerId: officerId || issue.assignedOfficerId,
      resolvedByOfficerName: officerName || issue.assignedOfficerName,
      resolutionNotes: notes,
      afterImageUrl: afterImageUrl || "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
      materialsUsed: materialsUsed || ["Standard repair materials", "Inspection verification seal"],
      verificationStatus: "pending",
      history: [...issue.history, historyEntry],
    });

    res.json({ issue: updated, message: "Issue resolved. Citizen verification notification sent." });
  });

  // Citizen Verify Resolution
  app.post("/api/v1/issues/:id/verify", (req, res) => {
    const { isSatisfied, verificationNotes, citizenName } = req.body;
    const issue = db.getIssueById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const now = new Date().toISOString();

    if (isSatisfied) {
      const historyEntry = {
        id: `hist-${Date.now()}`,
        timestamp: now,
        action: "Citizen Verified & Closed",
        actorName: citizenName || issue.reporterName || "Aria Montgomery",
        actorRole: "citizen" as const,
        details: `Citizen confirmed satisfactory repair. ${verificationNotes ? `Feedback: "${verificationNotes}"` : ""}`,
      };

      const updated = db.updateIssue(req.params.id, {
        status: "verified",
        verificationStatus: "verified_citizen",
        verifiedAt: now,
        verificationNotes,
        history: [...issue.history, historyEntry],
      });

      return res.json({
        issue: updated,
        message: "Resolution verified and ticket officially archived. Thank you!",
      });
    } else {
      // Disputed / Reopened
      const historyEntry = {
        id: `hist-${Date.now()}`,
        timestamp: now,
        action: "Resolution Disputed & Reopened",
        actorName: citizenName || issue.reporterName || "Aria Montgomery",
        actorRole: "citizen" as const,
        details: `Citizen reported defect still persists. Dispute reason: "${verificationNotes || "Defect not adequately repaired."}". Escalated to supervisor.`,
      };

      const updated = db.updateIssue(req.params.id, {
        status: "in_progress",
        verificationStatus: "disputed",
        disputeReason: verificationNotes,
        priorityScore: Math.min(100, issue.priorityScore + 10), // Boost priority
        history: [...issue.history, historyEntry],
      });

      return res.json({
        issue: updated,
        message: "Issue reopened and escalated to supervisor review.",
      });
    }
  });

  // ==========================================
  // CIVIC INTEGRITY / CONFIDENTIAL VAULT APIS
  // ==========================================
  app.get("/api/v1/integrity-reports", (req, res) => {
    const reports = db.getIntegrityReports();
    res.json({ reports, count: reports.length });
  });

  app.post("/api/v1/integrity-reports", (req, res) => {
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

  app.patch("/api/v1/integrity-reports/:id", (req, res) => {
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
  app.get("/api/v1/analytics/overview", (req, res) => {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CivicAI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});