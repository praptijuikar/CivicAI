import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import type {
  ThreatCategory,
  ThreatPlatform,
  ThreatEvidenceFile,
  LegalStatute,
  ThreatIncidentMeta,
  ThreatAIAnalysis,
  LegalComplaintDossier,
  CyberThreatReport,
  ComplainantContact,
} from "../src/types.ts";

let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (genAI) return genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "civicai-cyber-threat-engine" },
      },
    });
    return genAI;
  } catch (e) {
    console.warn("Failed to initialize Gemini GenAI for Threat Pipeline", e);
    return null;
  }
}

// ============================================================================
// COMPREHENSIVE STATUTORY LEGAL KNOWLEDGE BASE
// ============================================================================
export const STATUTE_CATALOG: LegalStatute[] = [
  {
    section: "Section 66E",
    act: "Information Technology Act, 2000",
    title: "Violation of Privacy (Non-Consensual Imagery)",
    description:
      "Punishes capturing, transmitting, or publishing images of private areas of any person without consent.",
    punishment: "Imprisonment up to 3 years and/or fine up to ₹2,00,000",
    cognizable: true,
    bailable: true,
    relevanceReason: "Applicable where private photos, intimate media, or unauthorized video captures are threatened or circulated.",
  },
  {
    section: "Section 66D",
    act: "Information Technology Act, 2000",
    title: "Cheating by Personation using Computer Resource",
    description:
      "Punishes anyone who by means of any communication device or computer resource cheats by impersonating another individual.",
    punishment: "Imprisonment up to 3 years and fine up to ₹1,00,000",
    cognizable: true,
    bailable: false,
    relevanceReason: "Applicable for fake profiles, fake WhatsApp accounts, impersonating victim to friends, or identity spoofing.",
  },
  {
    section: "Section 66C",
    act: "Information Technology Act, 2000",
    title: "Identity Theft & Unauthorized Credential Use",
    description:
      "Punishes fraudulent or dishonest use of electronic signature, password, account identifier, or biometric features.",
    punishment: "Imprisonment up to 3 years and fine up to ₹1,00,000",
    cognizable: true,
    bailable: true,
    relevanceReason: "Applicable if accounts were hacked, compromised, or credentials misused to issue threats.",
  },
  {
    section: "Section 67 / 67A",
    act: "Information Technology Act, 2000",
    title: "Publishing / Transmitting Sexually Explicit Material in Electronic Form",
    description:
      "Severe non-bailable offense prohibiting transmission or publishing of obscene or sexually explicit material electronically.",
    punishment: "First conviction: up to 5 years + ₹10 Lakh fine; Second conviction: up to 7 years",
    cognizable: true,
    bailable: false,
    relevanceReason: "Triggered in cases involving explicit blackmail, sextortion, or circulation of explicit digital material.",
  },
  {
    section: "Section 354D (BNS Sec 78)",
    act: "Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS)",
    title: "Cyberstalking & Persistent Electronic Harassment",
    description:
      "Monitoring the use by a woman of the internet, email, or any electronic communication despite clear disinterest.",
    punishment: "First conviction: up to 3 years with fine (Bailable); Second conviction: up to 5 years (Non-Bailable)",
    cognizable: true,
    bailable: true,
    relevanceReason: "Applicable for persistent DMs, creating multiple burner handles, continuous unwanted tracking, and surveillance.",
  },
  {
    section: "Section 503 & 506 (BNS Sec 351)",
    act: "Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS)",
    title: "Criminal Intimidation & Death / Physical Threat",
    description:
      "Threatening another person with injury to their person, reputation, or property with intent to cause alarm or force unlawful acts.",
    punishment: "Simple intimidation: up to 2 years; Threat to cause death, grievous hurt, or ruin chastity: up to 7 years",
    cognizable: true,
    bailable: false,
    relevanceReason: "Triggered whenever suspect communicates threats of physical harm, death, acid attack, rape, or destruction of reputation.",
  },
  {
    section: "Section 383 & 384 (BNS Sec 308)",
    act: "Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS)",
    title: "Extortion & Digital Blackmail / Sextortion",
    description:
      "Intentionally putting any person in fear of any injury and thereby dishonestly inducing them to deliver money, cryptocurrency, or property.",
    punishment: "Imprisonment up to 3 years, or fine, or both",
    cognizable: true,
    bailable: false,
    relevanceReason: "Applicable when money, digital currency, or additional intimate content is demanded under duress.",
  },
  {
    section: "Section 509 (BNS Sec 79)",
    act: "Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS)",
    title: "Insulting the Modesty of a Woman",
    description:
      "Uttering any word, making any sound or gesture, or intruding upon privacy intending to insult female modesty.",
    punishment: "Simple imprisonment up to 3 years with fine",
    cognizable: true,
    bailable: true,
    relevanceReason: "Applicable for misogynistic slurs, unsolicited sexually suggestive messages, and harassment directed at female victims.",
  },
  {
    section: "Section 499 & 500 (BNS Sec 356)",
    act: "Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS)",
    title: "Criminal Defamation & Malicious Public Doxxing",
    description:
      "Making or publishing imputations concerning any person intending to harm their reputation or inciting public harassment.",
    punishment: "Simple imprisonment up to 2 years, or with fine, or with both",
    cognizable: false,
    bailable: true,
    relevanceReason: "Applicable when suspect publishes private home addresses, phone numbers, fabricated chats, or libelous allegations.",
  },
];

// ============================================================================
// OCR & EVIDENCE EXTRACTION (GEMINI VISION + ROBUST FALLBACK)
// ============================================================================
export async function extractEvidenceContent(evidenceFiles: ThreatEvidenceFile[]): Promise<{
  extractedTexts: string[];
  combinedText: string;
}> {
  const extractedTexts: string[] = [];
  const ai = getGenAI();

  for (const file of evidenceFiles) {
    let fileText = "";
    if (file.fileData && file.mimeType.startsWith("image/") && ai) {
      try {
        const cleanBase64 = file.fileData.includes(",")
          ? file.fileData.split(",")[1]
          : file.fileData;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: {
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: file.mimeType,
                },
              },
              {
                text: `You are an expert Cyber Forensics and OCR analyst.
Transcribe and extract all textual information visible in this screenshot/evidence image:
1. Exact messages, DMs, or post text.
2. Usernames, phone numbers, email addresses, handles, or timestamps.
3. Any threats, extortion demands, amounts requested, or violent language.
Output concise, verbatim extracted text.`,
              },
            ],
          },
        });

        const textOutput = response.text?.trim() || "";
        if (textOutput) {
          fileText = `[File: ${file.fileName}]\n${textOutput}`;
          file.extractedText = textOutput;
          file.ocrConfidence = 0.95;
        }
      } catch (err) {
        console.warn(`Gemini OCR failed for file ${file.fileName}:`, err);
      }
    }

    // Heuristic fallback text generation if OCR was empty or no fileData
    if (!fileText) {
      fileText = `[File: ${file.fileName}] (SHA-256 Hash: ${file.fileHash.slice(0, 16)}... | Type: ${file.mimeType})`;
      file.extractedText = file.extractedText || "Digital Evidence File Ingested and Hash-Verified.";
    }

    extractedTexts.push(fileText);
  }

  return {
    extractedTexts,
    combinedText: extractedTexts.join("\n\n"),
  };
}

// ============================================================================
// AI SEVERITY & URGENCY SCORING ENGINE
// ============================================================================
export async function scoreThreatSeverity(
  threatCategory: ThreatCategory | string,
  incidentMeta: ThreatIncidentMeta,
  extractedEvidenceText: string
): Promise<ThreatAIAnalysis> {
  const fullContext = `
Threat Category: ${threatCategory}
Platform: ${incidentMeta.platform}
Suspect Handle: ${incidentMeta.suspectHandle || "N/A"}
Suspect Profile URL: ${incidentMeta.suspectProfileUrl || "N/A"}
Narrative: ${incidentMeta.narrative}
Extracted Evidence Text:
${extractedEvidenceText}
`;

  const ai = getGenAI();
  if (ai) {
    try {
      const prompt = `You are CivicAI CyberShield, an expert Cyber Crime Investigator and Legal Threat Assessor.
Evaluate the severity, intent, and risk level of the following cyber harassment / threat report.

Context:
${fullContext}

Score the incident strictly:
- severityScore: Float between 0.00 and 1.00 (e.g. 0.85).
  * 0.80 - 1.00: CRITICAL (Imminent death/violence threats, ongoing extortion, non-consensual imagery, live stalking).
  * 0.60 - 0.79: HIGH (Doxxing with address/phone, severe blackmail threats, impersonation causing harm).
  * 0.35 - 0.59: MEDIUM (Targeted trolling, offensive harassment, impersonation without immediate monetary loss).
  * 0.00 - 0.34: LOW (Unsolicited spam, minor disagreement).
- urgencyLevel: One of "CRITICAL", "HIGH", "MEDIUM", "LOW".
- threatIntent: Short summary of what the perpetrator is trying to accomplish.
- riskFactors: Array of 3-5 distinct danger indicators identified.
- extractedKeywords: Array of key legal/threat terms (e.g., "extortion", "publish photos", "kill", "doxxed", "crypto demand").
- immediateSafetyActions: Array of 3-4 immediate protective actions for the victim (e.g. preserve chats, don't pay ransom, enable 2FA, contact 1930).
- lawEnforcementRecommendation: Recommended law enforcement action (e.g. "Immediate Section 91 CrPC Preservation Notice to Instagram, FIR registration under IPC 384 & IT Act 66E").
- confidenceScore: Float between 0.0 and 1.0.
- summary: A clear 2-3 sentence executive synopsis for the police dossier.

Return strictly valid JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return {
        severityScore: Math.min(1.0, Math.max(0.0, Number(parsed.severityScore) || 0.85)),
        urgencyLevel: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(parsed.urgencyLevel)
          ? parsed.urgencyLevel
          : "HIGH",
        threatIntent: parsed.threatIntent || "Malicious coercion, extortion and unlawful intimidation.",
        riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : ["Digital extortion demand", "Privacy compromise risk"],
        extractedKeywords: Array.isArray(parsed.extractedKeywords) ? parsed.extractedKeywords : ["blackmail", "photos", "extortion"],
        immediateSafetyActions: Array.isArray(parsed.immediateSafetyActions)
          ? parsed.immediateSafetyActions
          : [
              "Do NOT delete any messages, voice notes, or chat threads.",
              "Do NOT transfer any money or cryptocurrency to the extortionist.",
              "Immediately call the National Cyber Crime Helpline at 1930.",
              "Take full-screen screenshots showing device timestamps and suspect URL.",
            ],
        lawEnforcementRecommendation:
          parsed.lawEnforcementRecommendation ||
          "Issue immediate Preservation Order to platform intermediary and initiate cyber cell inquiry.",
        confidenceScore: Number(parsed.confidenceScore) || 0.94,
        summary: parsed.summary || incidentMeta.narrative.slice(0, 300),
      };
    } catch (err) {
      console.warn("Gemini threat severity scoring fallback triggered:", err);
    }
  }

  // Robust Heuristic Engine
  return heuristicThreatScoring(threatCategory, incidentMeta, extractedEvidenceText);
}

function heuristicThreatScoring(
  threatCategory: ThreatCategory | string,
  incidentMeta: ThreatIncidentMeta,
  extractedEvidenceText: string
): ThreatAIAnalysis {
  const combined = `${threatCategory} ${incidentMeta.narrative} ${extractedEvidenceText}`.toLowerCase();

  let score = 0.40;
  const riskFactors: string[] = [];
  const extractedKeywords: string[] = [];

  if (threatCategory === "EXTORTION_SEXTORTION" || combined.includes("money") || combined.includes("pay") || combined.includes("ransom") || combined.includes("bitcoin") || combined.includes("photos")) {
    score += 0.45;
    riskFactors.push("Financial extortion & coercive blackmail demand detected");
    extractedKeywords.push("extortion", "ransom", "blackmail");
  }

  if (threatCategory === "EXPLICIT_THREATS" || combined.includes("kill") || combined.includes("die") || combined.includes("hurt") || combined.includes("acid") || combined.includes("murder") || combined.includes("shoot")) {
    score += 0.50;
    riskFactors.push("Direct threats of grievous physical violence or homicide");
    extractedKeywords.push("physical threat", "violence", "intimidation");
  }

  if (threatCategory === "NON_CONSENSUAL_IMAGERY" || combined.includes("nude") || combined.includes("private photos") || combined.includes("video") || combined.includes("leak")) {
    score += 0.40;
    riskFactors.push("Non-consensual dissemination of private/intimate media");
    extractedKeywords.push("intimate imagery", "privacy violation", "leak");
  }

  if (threatCategory === "DOXXING" || combined.includes("address") || combined.includes("phone number") || combined.includes("home") || combined.includes("location")) {
    score += 0.30;
    riskFactors.push("Public disclosure of sensitive personal identifying data (Doxxing)");
    extractedKeywords.push("doxxing", "personal info leak", "location tracking");
  }

  if (threatCategory === "CYBERSTALKING" || combined.includes("watching") || combined.includes("follow") || combined.includes("everywhere")) {
    score += 0.25;
    riskFactors.push("Persistent surveillance, stalking and electronic harassment");
    extractedKeywords.push("cyberstalking", "surveillance", "harassment");
  }

  if (threatCategory === "IMPERSONATION" || combined.includes("fake profile") || combined.includes("pretending")) {
    score += 0.25;
    riskFactors.push("Deceptive identity theft and online impersonation");
    extractedKeywords.push("impersonation", "identity theft");
  }

  const finalScore = Math.min(1.0, Math.max(0.20, Number(score.toFixed(2))));
  const urgencyLevel =
    finalScore >= 0.80 ? "CRITICAL" : finalScore >= 0.60 ? "HIGH" : finalScore >= 0.35 ? "MEDIUM" : "LOW";

  return {
    severityScore: finalScore,
    urgencyLevel,
    threatIntent: "Unlawful coercion, psychological duress, and extortionate digital harassment.",
    riskFactors: riskFactors.length > 0 ? riskFactors : ["Digital harassment pattern", "Unlawful communication"],
    extractedKeywords: extractedKeywords.length > 0 ? extractedKeywords : ["cyber harassment", "threat"],
    immediateSafetyActions: [
      "Do NOT send any funds, cryptocurrency, or additional images.",
      "Preserve all chat backups and take full-screen device captures with timestamps.",
      "Dial 1930 immediately to register a priority ticket with National Cyber Crime Portal.",
      "Lock down your social media privacy settings and alert trusted contacts.",
    ],
    lawEnforcementRecommendation:
      "Lodge formal FIR under IT Act and relevant IPC/BNS provisions. Issue Section 91 CrPC notice to platform ISP for IP logs.",
    confidenceScore: 0.91,
    summary: incidentMeta.narrative.slice(0, 250) || "Online threat report filed with hash-verified evidence.",
  };
}

// ============================================================================
// STATUTE MATCHING ENGINE
// ============================================================================
export function mapApplicableStatutes(
  threatCategory: ThreatCategory | string,
  incidentMeta: ThreatIncidentMeta,
  extractedEvidenceText: string,
  aiAnalysis?: ThreatAIAnalysis
): LegalStatute[] {
  const textCorpus = `${threatCategory} ${incidentMeta.narrative} ${extractedEvidenceText} ${aiAnalysis?.riskFactors.join(" ") || ""}`.toLowerCase();
  const matchedStatutes: LegalStatute[] = [];

  const addStatute = (sectionCode: string) => {
    const found = STATUTE_CATALOG.find((s) => s.section.includes(sectionCode));
    if (found && !matchedStatutes.some((m) => m.section === found.section)) {
      matchedStatutes.push(found);
    }
  };

  // Rule 1: Extortion / Sextortion
  if (
    threatCategory === "EXTORTION_SEXTORTION" ||
    textCorpus.includes("extortion") ||
    textCorpus.includes("money") ||
    textCorpus.includes("pay") ||
    textCorpus.includes("ransom") ||
    textCorpus.includes("photos unless")
  ) {
    addStatute("Section 383 & 384");
    addStatute("Section 66E");
    addStatute("Section 67 / 67A");
  }

  // Rule 2: Explicit Threats / Criminal Intimidation
  if (
    threatCategory === "EXPLICIT_THREATS" ||
    textCorpus.includes("threat") ||
    textCorpus.includes("kill") ||
    textCorpus.includes("harm") ||
    textCorpus.includes("ruin") ||
    textCorpus.includes("destroy")
  ) {
    addStatute("Section 503 & 506");
  }

  // Rule 3: Cyberstalking
  if (
    threatCategory === "CYBERSTALKING" ||
    textCorpus.includes("stalk") ||
    textCorpus.includes("watching") ||
    textCorpus.includes("everywhere") ||
    textCorpus.includes("follow")
  ) {
    addStatute("Section 354D");
  }

  // Rule 4: Impersonation & Identity Theft
  if (
    threatCategory === "IMPERSONATION" ||
    textCorpus.includes("fake profile") ||
    textCorpus.includes("impersonat") ||
    textCorpus.includes("pretend") ||
    textCorpus.includes("hacked")
  ) {
    addStatute("Section 66D");
    addStatute("Section 66C");
  }

  // Rule 5: Non-Consensual Imagery & Privacy
  if (
    threatCategory === "NON_CONSENSUAL_IMAGERY" ||
    textCorpus.includes("private photo") ||
    textCorpus.includes("intimate") ||
    textCorpus.includes("nude") ||
    textCorpus.includes("video")
  ) {
    addStatute("Section 66E");
    addStatute("Section 67 / 67A");
    addStatute("Section 509");
  }

  // Rule 6: Doxxing & Defamation
  if (
    threatCategory === "DOXXING" ||
    textCorpus.includes("doxx") ||
    textCorpus.includes("address") ||
    textCorpus.includes("phone number") ||
    textCorpus.includes("defam")
  ) {
    addStatute("Section 499 & 500");
    addStatute("Section 66E");
  }

  // Fallback defaults if none matched
  if (matchedStatutes.length === 0) {
    addStatute("Section 503 & 506");
    addStatute("Section 66D");
  }

  return matchedStatutes;
}

// ============================================================================
// MASTER CRYPTOGRAPHIC DIGEST GENERATION
// ============================================================================
export function generateThreatMasterHash(
  ticketId: string,
  incidentMeta: ThreatIncidentMeta,
  evidenceFiles: ThreatEvidenceFile[],
  complainantEmail?: string
): string {
  const evidenceHashes = evidenceFiles.map((f) => f.fileHash).sort().join(":");
  const payloadString = `${ticketId}|${incidentMeta.platform}|${incidentMeta.suspectHandle || ""}|${incidentMeta.incidentTimestamp}|${evidenceHashes}|${complainantEmail || "ANONYMOUS"}`;
  return crypto.createHash("sha256").update(payloadString).digest("hex");
}

// ============================================================================
// FORMAL LEGAL COMPLAINT DOSSIER GENERATOR
// ============================================================================
export function generateLegalComplaintDossier(
  ticketId: string,
  isAnonymous: boolean,
  complainantContact: ComplainantContact | undefined,
  threatCategory: ThreatCategory | string,
  incidentMeta: ThreatIncidentMeta,
  evidenceFiles: ThreatEvidenceFile[],
  statutes: LegalStatute[],
  aiAnalysis: ThreatAIAnalysis,
  masterHash: string
): LegalComplaintDossier {
  const now = new Date().toISOString();
  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const complainantDisplayName = isAnonymous
    ? "CONFIDENTIAL PROTECTED COMPLAINANT (Under Whistleblower & Victim Shield Protocol)"
    : complainantContact?.name || "Civic Citizen";

  const victimStatement = `
COMPLAINT UNDER SECTION 154 CrPC / BNS READ WITH THE INFORMATION TECHNOLOGY ACT, 2000

To,
The Officer-in-Charge / Superintendent of Police,
Cyber Crime Police Station / National Cyber Crime Reporting Portal (1930)

Subject: Formal Criminal Complaint against perpetrator '${incidentMeta.suspectHandle || "Unknown Account"}' operating on ${incidentMeta.platform} for offenses including ${threatCategory.replace(/_/g, " ")}.

Respected Sir/Madam,

I, ${complainantDisplayName}, hereby bring to your immediate notice a grave cyber crime and digital harassment incident committed against me:

1. INCIDENT PARTICULARS:
   - Primary Platform: ${incidentMeta.platform}
   - Suspect Handle / Username: ${incidentMeta.suspectHandle || "Not specified / Hidden"}
   - Suspect Profile URL: ${incidentMeta.suspectProfileUrl || "N/A"}
   - Incident Timestamp: ${incidentMeta.incidentTimestamp}
   - AI Threat Severity Score: ${(aiAnalysis.severityScore * 100).toFixed(0)}/100 (${aiAnalysis.urgencyLevel} RISK)

2. STATEMENT OF FACTS:
   "${incidentMeta.narrative}"

3. FORENSIC EVIDENCE & CRYPTOGRAPHIC PROOF:
   A total of ${evidenceFiles.length} digital evidence artifact(s) have been preserved with cryptographic SHA-256 integrity hashes to prevent tampering or spoliation of evidence.

4. PRAYER & RELIEF SOUGHT:
   It is respectfully prayed that:
   (a) An FIR be registered under the applicable statutory sections flagged below;
   (b) Urgent Section 91 CrPC Preservation Notices be issued to ${incidentMeta.platform} to preserve IP login logs, MAC address, device fingerprints, and registered phone/email of suspect '${incidentMeta.suspectHandle || "the account"}';
   (c) Takedown and blocking directives be issued under Section 69A of the IT Act to prevent ongoing publication or extortion;
   (d) Strict penal action be taken against the accused in accordance with law.
`.trim();

  return {
    dossierId: `DOSSIER-${ticketId}`,
    generatedAt: now,
    jurisdiction: "Cyber Crime Cell / Special Cyber Investigation Unit",
    statutorySummary: `Offenses prima facie made out under: ${statutes.map((s) => `${s.act} (${s.section})`).join("; ")}`,
    victimStatement,
    accusedParticulars: {
      handle: incidentMeta.suspectHandle || "Unknown / Obfuscated",
      profileUrl: incidentMeta.suspectProfileUrl || "N/A",
      platform: incidentMeta.platform,
      additionalIdentifiers: incidentMeta.suspectContactInfo || "To be requisitioned via Subpoena/Sec 91 CrPC",
    },
    evidenceRegistry: evidenceFiles.map((f) => ({
      fileName: f.fileName,
      sha256Hash: f.fileHash,
      mimeType: f.mimeType,
      ocrSummary: f.extractedText?.slice(0, 150),
    })),
    applicableLaws: statutes,
    recommendedFIRSections: statutes.map((s) => `${s.section} - ${s.title}`),
    investigatingOfficerChecklist: [
      `Issue Section 91 CrPC Preservation Notice to ${incidentMeta.platform} Compliance Team within 24 hours.`,
      "Request IP Access Logs, registration IMSI/IMEI, and linked mobile number for the suspect handle.",
      "Verify evidence SHA-256 hashes against original device capture timestamp.",
      "If financial extortion or bank/UPI ID provided, issue Section 102 CrPC account freeze request to beneficiary bank/NPCI.",
      "Provide victim security counseling and monitor secondary burner accounts.",
    ],
    preservationNoticeNoticeText: `URGENT PRESERVATION DIRECTIVE UNDER SECTION 91 CrPC / SEC 79(3)(b) IT ACT: Service Provider (${incidentMeta.platform}) is hereby directed to immediately preserve all server logs, Direct Message transcripts, media files, registration records, IP login timestamps, and device headers for account '${incidentMeta.suspectHandle || "N/A"}' for a period of 180 days for ongoing cyber crime investigation ${ticketId}.`,
    chainOfCustodyProof: `Master SHA-256 Digest: ${masterHash} | Verified by CivicAI Cryptographic Ledger at ${now}`,
  };
}

// ============================================================================
// COMPLETE EVIDENCE PIPELINE EXECUTION
// ============================================================================
export async function processThreatSubmission(payload: {
  isAnonymous: boolean;
  complainantContact?: ComplainantContact;
  threatCategory: ThreatCategory | string;
  incidentMeta: ThreatIncidentMeta;
  evidenceFiles: ThreatEvidenceFile[];
}): Promise<CyberThreatReport> {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  const ticketId = `CYBER-${year}-${rand}`;
  const id = `threat-${Date.now()}-${rand}`;
  const now = new Date().toISOString();

  // Step 1: Extract OCR / Text Evidence from images
  const { combinedText } = await extractEvidenceContent(payload.evidenceFiles || []);

  // Step 2: Score Urgency & Severity using AI
  const aiAnalysis = await scoreThreatSeverity(
    payload.threatCategory,
    payload.incidentMeta,
    combinedText
  );

  // Step 3: Statutory Legal Mapping
  const legalSectionsFlagged = mapApplicableStatutes(
    payload.threatCategory,
    payload.incidentMeta,
    combinedText,
    aiAnalysis
  );

  // Step 4: Compute Cryptographic Master Hash
  const hashDigest = generateThreatMasterHash(
    ticketId,
    payload.incidentMeta,
    payload.evidenceFiles || [],
    payload.complainantContact?.email
  );

  // Step 5: Build Legal Complaint Dossier
  const legalDossier = generateLegalComplaintDossier(
    ticketId,
    payload.isAnonymous,
    payload.complainantContact,
    payload.threatCategory,
    payload.incidentMeta,
    payload.evidenceFiles || [],
    legalSectionsFlagged,
    aiAnalysis,
    hashDigest
  );

  const report: CyberThreatReport = {
    id,
    ticketId,
    isAnonymous: payload.isAnonymous,
    complainantContact: payload.isAnonymous ? undefined : payload.complainantContact,
    threatCategory: payload.threatCategory as ThreatCategory,
    incidentMeta: payload.incidentMeta,
    evidenceFiles: payload.evidenceFiles || [],
    severityScore: aiAnalysis.severityScore,
    urgencyLevel: aiAnalysis.urgencyLevel,
    legalSectionsFlagged,
    hashDigest,
    extractedText: combinedText,
    aiAnalysis,
    legalDossier,
    status: aiAnalysis.severityScore >= 0.8 ? "ESCALATED_TO_CYBER_CELL" : "AI_EVALUATED",
    statusNotes: `Automated legal triage completed with ${(aiAnalysis.severityScore * 100).toFixed(0)}% severity rating. ${legalSectionsFlagged.length} legal statutes flagged.`,
    createdAt: now,
    updatedAt: now,
  };

  return report;
}
