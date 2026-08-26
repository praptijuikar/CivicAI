import { GoogleGenAI, Type } from "@google/genai";
import type { AIAnalysisResult, Severity, VerificationStatus, SceneRelevance } from "../src/types.ts";

let genAI: GoogleGenAI | null = null;
let consecutiveFailures = 0;
let circuitOpenedAt = 0;
const CIRCUIT_FAILURE_THRESHOLD = Number(process.env.AI_CIRCUIT_FAILURE_THRESHOLD) || 3;
const CIRCUIT_COOLDOWN_MS = Number(process.env.AI_CIRCUIT_COOLDOWN_MS) || 30_000;
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 15_000;

// Verification thresholds — tune these from your validation dataset
const VERIFIED_THRESHOLD = Number(process.env.AI_VERIFIED_THRESHOLD) || 0.70;
const REVIEW_THRESHOLD = Number(process.env.AI_REVIEW_THRESHOLD) || 0.40;

function isCircuitOpen(): boolean {
  if (!circuitOpenedAt) return false;
  if (Date.now() - circuitOpenedAt < CIRCUIT_COOLDOWN_MS) return true;
  circuitOpenedAt = 0;
  return false;
}

function recordAiSuccess(): void {
  consecutiveFailures = 0;
  circuitOpenedAt = 0;
}

function recordAiFailure(): void {
  consecutiveFailures += 1;
  if (consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    circuitOpenedAt = Date.now();
    console.warn(`AI circuit opened after ${consecutiveFailures} consecutive failures. Using rule-based fallback for ${CIRCUIT_COOLDOWN_MS}ms.`);
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`AI request timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function getGenAI(): GoogleGenAI | null {
  if (genAI) return genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not configured. Will use structured fallback CV engine.");
    return null;
  }
  genAI = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  return genAI;
}

/**
 * Derives the three-state verification status from the raw AI confidence.
 *
 * confidence >= VERIFIED_THRESHOLD  → "verified"
 * REVIEW_THRESHOLD–VERIFIED_THRESHOLD → "needs_review"
 * < REVIEW_THRESHOLD                → "no_issue_detected"
 */
function deriveVerificationStatus(confidence: number): VerificationStatus {
  if (confidence >= VERIFIED_THRESHOLD) return "verified";
  if (confidence >= REVIEW_THRESHOLD) return "needs_review";
  return "no_issue_detected";
}

export async function analyzeCivicImage(
  imageBase64: string,
  mimeType: string = "image/jpeg",
  userContextDescription?: string
): Promise<AIAnalysisResult> {
  const ai = getGenAI();

  if (ai && !isCircuitOpen()) {
    try {
      // Clean base64 string if it contains data URI prefix
      const cleanBase64 = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;

      const prompt = `You are CivicAI Vision, an expert Municipal Civil Engineering & Hazard Assessment AI.
Analyze this civic infrastructure/public works image carefully.
${userContextDescription ? `User noted: "${userContextDescription}"` : ""}

IMPORTANT SCENE VALIDATION:
1. First, determine if this is a valid real-world photograph, or a blatant screenshot/tampered image (isAuthentic). Normal smartphone photos, slightly blurry images, compressed files, or photos taken of screens/monitors in the field are AUTHENTIC. Only reject as a screenshot if there are obvious device UI elements (like phone status bars, app navigation buttons) or blatant stock-photo watermarks. If you cannot definitively prove it is a screenshot, default to true. Provide reasoning in authenticityReasoning.
2. Determine whether this image actually shows a road, street, or public infrastructure scene (isValidScene). If it's a bedroom, selfie, or random indoor object, it is NOT a valid scene.
3. Determine if an actual civic issue is visible in the scene (hasVisibleIssue). If it's just a normal clean road, there is no issue.
4. If the user provided a category context, check if the visible issue matches that category (isCategoryMismatch).
5. Only if isValidScene and hasVisibleIssue are true, populate the remaining fields with high confidence. Otherwise, set confidence low and populate the reason in the summary.

Evaluate:
1. isValidScene (boolean)
2. hasVisibleIssue (boolean)
3. primaryIssueDetected (string: briefly describe what you see)
4. isCategoryMismatch (boolean)
5. isAuthentic (boolean)
6. authenticityReasoning (string)
7. Primary Category (Must be one of: "Roads & Infrastructure", "Sanitation & Waste", "Water & Sewage", "Electrical & Lighting", "Parks & Public Spaces", "Public Safety & Encroachment", "Public Property Defect").
6. Specific Subcategory (e.g., "Deep Pothole", "Open Sewer Manhole").
7. Confidence Score (0.0 to 1.0). Be HONEST. If no issue or not a scene, return < 0.3.
8. Scene Relevance ("road_infrastructure", "non_infrastructure", or "uncertain").
9. Severity Rating ("Critical", "High", "Medium", "Low").
10. Calculated Priority Score (integer 0-100).
11. Potential Public Safety Risks (list of 2-4 hazards).
12. Recommended Responsible Municipal Department.
13. Estimated Resolution Time in Hours (integer).
14. Suggested Equipment & Materials.
15. Action Checklist for First Responders.
16. Concise Executive Summary.`;

      const response = await withTimeout(ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || "image/jpeg",
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValidScene: { type: Type.BOOLEAN },
              hasVisibleIssue: { type: Type.BOOLEAN },
              primaryIssueDetected: { type: Type.STRING },
              isCategoryMismatch: { type: Type.BOOLEAN },
              isAuthentic: { type: Type.BOOLEAN },
              authenticityReasoning: { type: Type.STRING },
              predictedCategory: { type: Type.STRING },
              subcategory: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              sceneRelevance: {
                type: Type.STRING,
                description: "One of: road_infrastructure, non_infrastructure, uncertain",
              },
              severity: {
                type: Type.STRING,
                description: "One of: Critical, High, Medium, Low",
              },
              calculatedPriorityScore: { type: Type.INTEGER },
              safetyRisks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              recommendedDepartment: { type: Type.STRING },
              estimatedResolutionHours: { type: Type.INTEGER },
              suggestedEquipment: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              actionChecklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              summary: { type: Type.STRING },
            },
            required: [
              "isValidScene",
              "hasVisibleIssue",
              "primaryIssueDetected",
              "isCategoryMismatch",
              "isAuthentic",
              "authenticityReasoning",
              "predictedCategory",
              "subcategory",
              "confidence",
              "sceneRelevance",
              "severity",
              "calculatedPriorityScore",
              "safetyRisks",
              "recommendedDepartment",
              "estimatedResolutionHours",
              "suggestedEquipment",
              "actionChecklist",
              "summary",
            ],
          },
        },
      }), AI_TIMEOUT_MS);

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        recordAiSuccess();

        // Use the raw confidence from the model — no artificial clamping
        const rawConfidence = Math.min(1.0, Math.max(0, Number(parsed.confidence) || 0));
        const sceneRelevance: SceneRelevance =
          (["road_infrastructure", "non_infrastructure", "uncertain"] as const).includes(parsed.sceneRelevance)
            ? parsed.sceneRelevance
            : "uncertain";

        // If scene is non-infrastructure, force low confidence regardless of model output
        const effectiveConfidence =
          sceneRelevance === "non_infrastructure" ? Math.min(rawConfidence, 0.15) : rawConfidence;

        const verificationStatus = deriveVerificationStatus(effectiveConfidence);

        return {
          isValidScene: Boolean(parsed.isValidScene),
          hasVisibleIssue: Boolean(parsed.hasVisibleIssue),
          primaryIssueDetected: parsed.primaryIssueDetected || "",
          isCategoryMismatch: Boolean(parsed.isCategoryMismatch),
          isAuthentic: Boolean(parsed.isAuthentic ?? true),
          authenticityReasoning: parsed.authenticityReasoning || "Appears authentic",
          predictedCategory: parsed.predictedCategory || "Roads & Infrastructure",
          subcategory: parsed.subcategory || "Structural Defect",
          confidence: effectiveConfidence,
          severity: (["Critical", "High", "Medium", "Low"].includes(parsed.severity)
            ? parsed.severity
            : "Low") as Severity,
          calculatedPriorityScore: Math.min(100, Math.max(0, Number(parsed.calculatedPriorityScore) || 0)),
          safetyRisks: parsed.safetyRisks?.length ? parsed.safetyRisks : ["General pedestrian and vehicle hazard"],
          recommendedDepartment: parsed.recommendedDepartment || "Department of Public Works",
          estimatedResolutionHours: Number(parsed.estimatedResolutionHours) || 24,
          suggestedEquipment: parsed.suggestedEquipment?.length ? parsed.suggestedEquipment : ["Standard repair toolkit", "Safety cones"],
          actionChecklist: parsed.actionChecklist?.length ? parsed.actionChecklist : ["Secure perimeter", "Inspect damage", "Perform standard repair"],
          summary: parsed.summary || "Visual inspection completed. Identified municipal infrastructure issue requiring dispatch.",
          rawResponse: responseText,
          verificationStatus,
          sceneRelevance,
        };
      }
    } catch (err) {
      recordAiFailure();
      console.error("Gemini API visual analysis error, utilizing rule-based fallback:", err);
    }
  } else if (ai) {
    console.warn("AI circuit is open; using rule-based fallback classification.");
  }

  // Rule-based fallback keeps classification available during AI outages.
  return fallbackCVAnalysis(userContextDescription);
}

/**
 * Rule-based fallback for when AI is unavailable.
 *
 * Returns HONEST low confidence and "needs_review" status because
 * keyword-matching alone cannot verify a civic issue with certainty.
 */
export function fallbackCVAnalysis(userText?: string): AIAnalysisResult {
  const text = (userText || "").toLowerCase();

  // All fallback results use low confidence and "needs_review" because
  // we have no actual image analysis — only keyword matching on text.
  const FALLBACK_CONFIDENCE = 0.30;
  const FALLBACK_VERIFICATION: VerificationStatus = "needs_review";
  const FALLBACK_SCENE: SceneRelevance = "uncertain";

  if (text.includes("water") || text.includes("leak") || text.includes("pipe") || text.includes("drain") || text.includes("sewer")) {
    return {
      isValidScene: true,
      hasVisibleIssue: true,
      primaryIssueDetected: "Water leak or drainage issue",
      isCategoryMismatch: false,
      isAuthentic: true,
      authenticityReasoning: "Fallback - assumed authentic",
      predictedCategory: "Water & Sewage",
      subcategory: "Pipeline Leak / Pressure Burst",
      confidence: FALLBACK_CONFIDENCE,
      severity: "High",
      calculatedPriorityScore: 84,
      safetyRisks: [
        "Water stagnation causing road foundation erosion",
        "Loss of municipal drinking water supply",
        "Pedestrian skidding hazard",
      ],
      recommendedDepartment: "Water Supply & Sewerage Board",
      estimatedResolutionHours: 12,
      suggestedEquipment: [
        "Hydraulic Pipe Clamp Set",
        "Submersible De-watering Pump",
        "Replacement 4-inch PVC Collar",
      ],
      actionChecklist: [
        "Isolate sub-zone water gate valve #14",
        "Excavate 1.2m around rupture point",
        "Replace damaged coupling & pressurize test",
      ],
      summary: "Keyword-based classification detected possible water infrastructure issue. Awaiting human verification.",
      verificationStatus: FALLBACK_VERIFICATION,
      sceneRelevance: FALLBACK_SCENE,
    };
  }

  if (text.includes("light") || text.includes("wire") || text.includes("electric") || text.includes("lamp") || text.includes("pole")) {
    return {
      isValidScene: true,
      hasVisibleIssue: true,
      primaryIssueDetected: "Electrical or lighting issue",
      isCategoryMismatch: false,
      isAuthentic: true,
      authenticityReasoning: "Fallback - assumed authentic",
      predictedCategory: "Electrical & Lighting",
      subcategory: "Exposed High-Voltage Cable & Damaged Pole",
      confidence: FALLBACK_CONFIDENCE,
      severity: "Critical",
      calculatedPriorityScore: 95,
      safetyRisks: [
        "Extreme electrocution hazard for pedestrians in wet weather",
        "Zero roadway visibility during nighttime peak traffic",
      ],
      recommendedDepartment: "City Power & Electrical Services",
      estimatedResolutionHours: 4,
      suggestedEquipment: [
        "High-voltage Insulated Bucket Truck",
        "Thermal Imager & Voltage Detector",
        "Armored Conduit Sleeves",
      ],
      actionChecklist: [
        "Emergency circuit trip command via SCADA node 09",
        "Place 10m high-visibility cordon perimeter",
        "Splice insulated conduit and restore phase balance",
      ],
      summary: "Keyword-based classification detected possible electrical hazard. Awaiting human verification.",
      verificationStatus: FALLBACK_VERIFICATION,
      sceneRelevance: FALLBACK_SCENE,
    };
  }

  if (text.includes("garbage") || text.includes("waste") || text.includes("trash") || text.includes("dump") || text.includes("bin")) {
    return {
      isValidScene: true,
      hasVisibleIssue: true,
      primaryIssueDetected: "Sanitation or waste issue",
      isCategoryMismatch: false,
      isAuthentic: true,
      authenticityReasoning: "Fallback - assumed authentic",
      predictedCategory: "Sanitation & Waste",
      subcategory: "Unauthorized Heavy Bio-Waste Accumulation",
      confidence: FALLBACK_CONFIDENCE,
      severity: "Medium",
      calculatedPriorityScore: 68,
      safetyRisks: [
        "Public health bio-hazard and pest vector breeding",
        "Drainage channel clogging during rainfall",
      ],
      recommendedDepartment: "Municipal Solid Waste Management",
      estimatedResolutionHours: 18,
      suggestedEquipment: [
        "8-Ton Compactor Truck",
        "Mechanical Skid-Steer Loader",
        "Industrial Disinfectant Sprayer",
      ],
      actionChecklist: [
        "Clear 4.5 cubic meters of solid accumulation",
        "Chemical washdown and pest control treatment",
        "Install anti-dumping surveillance signage",
      ],
      summary: "Keyword-based classification detected possible sanitation issue. Awaiting human verification.",
      verificationStatus: FALLBACK_VERIFICATION,
      sceneRelevance: FALLBACK_SCENE,
    };
  }

  // Default: Road Infrastructure / Pothole
  return {
    isValidScene: true,
    hasVisibleIssue: true,
    primaryIssueDetected: "General infrastructure issue",
    isCategoryMismatch: false,
    isAuthentic: true,
    authenticityReasoning: "Fallback - assumed authentic",
    predictedCategory: "Roads & Infrastructure",
    subcategory: "Deep Asphalt Pothole & Sub-base Failure",
    confidence: FALLBACK_CONFIDENCE,
    severity: "High",
    calculatedPriorityScore: 88,
    safetyRisks: [
      "High probability of two-wheeler rim bending or crash",
      "Abrupt vehicle braking causing rear-end collisions",
      "Water accumulation masking cavity depth",
    ],
    recommendedDepartment: "Department of Public Works",
    estimatedResolutionHours: 24,
    suggestedEquipment: [
      "Hot-Mix Asphalt Cold Patch Unit",
      "Vibratory Plate Compactor (15kN)",
      "Bituminous Emulsion Spray Rig",
    ],
    actionChecklist: [
      "Deploy reflective traffic warning pylons 30m prior",
      "Square off cavity edges with pneumatic cutter",
      "Apply tack coat, fill cold-mix asphalt, and compact in 2-inch lifts",
    ],
    summary: "Keyword-based classification detected possible road infrastructure issue. Awaiting human verification.",
    verificationStatus: FALLBACK_VERIFICATION,
    sceneRelevance: FALLBACK_SCENE,
  };
}
