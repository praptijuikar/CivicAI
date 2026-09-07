export type Language = "en" | "es" | "fr" | "hi" | "zh" | "bn";
export type UserRole = 'citizen' | 'admin' | 'officer' | 'investigator' | 'auditor';
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  avatar?: string;
  department?: string;
  departmentId?: string;
  departmentName?: string;
  badgeNumber?: string;
  phone?: string;
  reputationScore?: number;
  activeTasksCount?: number;
  passwordHash?: string;
  createdAt: string;
}

export type CivicCategory =
  | 'Roads & Infrastructure'
  | 'Sanitation & Waste'
  | 'Water & Sewage'
  | 'Electrical & Lighting'
  | 'Parks & Public Spaces'
  | 'Public Safety & Encroachment'
  | 'Public Property Defect';

export type IssueStatus =
  | 'submitted'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'verified'
  | 'escalated'
  | 'duplicate_resolved';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type VerificationStatus = "verified" | "needs_review" | "no_issue_detected";
export type SceneRelevance = "road_infrastructure" | "non_infrastructure" | "uncertain";

export interface AIAnalysisResult {
  isValidScene: boolean;
  hasVisibleIssue: boolean;
  primaryIssueDetected: string;
  isCategoryMismatch: boolean;
  isAuthentic: boolean;
  authenticityReasoning: string;
  predictedCategory: string;
  subcategory: string;
  confidence: number;
  severity: Severity;
  calculatedPriorityScore: number;
  safetyRisks: string[];
  recommendedDepartment: string;
  estimatedResolutionHours: number;
  suggestedEquipment: string[];
  actionChecklist: string[];
  summary: string;
  rawResponse?: string;
  verificationStatus: VerificationStatus;
  sceneRelevance: SceneRelevance;
}

export interface IssueHistoryItem {
  id: string;
  timestamp: string;
  action: string;
  actorName: string;
  actorRole: UserRole;
  details: string;
  meta?: Record<string, any>;
}

export interface CivicIssue {
  locationAddress: string;
  aiUrgencyScore: number;
  upvotesCount: number;
  id: string;
  userId: string;
  reporterName: string;
  isAnonymous?: boolean;
  reporterContact?: string;
  title: string;
  category: string;
  subcategory: string;
  queryHash?: string;
  deviceTag?: string;
  website?: string;
  clientId?: string;
  moderationStatus?: "clear" | "pending" | "spam" | "fake";
  tenantId?: string;
  sourceLanguage?: string;
  normalizedDescription?: string;
  estimatedRepairCost?: number;
  wardTag?: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  status: IssueStatus;
  priorityScore: number; // 0 - 100
  severity: Severity;
  reportCount: number; // For duplicate merges / upvotes
  upvotes: number;
  upvotedUserIds?: string[];

  // Assignment & Routing
  assignedDepartment?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedOfficerPhone?: string;
  assignedAt?: string;
  deadlineAt?: string;
  slaHours?: number;

  // Images
  initialImageUrl?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;

  // Officer resolution
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedByOfficerId?: string;
  resolvedByOfficerName?: string;
  materialsUsed?: string[];

  // Citizen verification
  verificationStatus?: 'pending' | 'verified_citizen' | 'disputed';
  verificationNotes?: string;
  verifiedAt?: string;
  disputeReason?: string;

  // AI visual analysis
  aiAnalysis?: AIAnalysisResult;

  // Audit history
  history: IssueHistoryItem[];

  // Deduplication
  masterIssueId?: string;
  duplicateIds?: string[];
  mergedReporterEmails?: string[];

  createdAt: string;
  updatedAt: string;
}

export type IntegrityCategory =
  | 'Suspected Bribery'
  | 'Unauthorized Construction'
  | 'Illegal Dumping'
  | 'Encroachment & Land Grabbing'
  | 'Misuse of Public Property'
  | 'Procurement Fraud & Kickbacks'
  | 'Safety Protocol Violation';

export type IntegrityStatus =
  | 'under_review'
  | 'investigation_active'
  | 'action_taken'
  | 'dismissed'
  | 'whistleblower_protected';

export interface IntegrityEvidenceFile {
  id: string;
  name: string;
  url: string;
  size: string;
  mimeType: string;
  sha256Hash: string;
}

export interface IntegrityAuditStep {
  id: string;
  stepName: string;
  timestamp: string;
  status: 'completed' | 'current' | 'pending';
  actor: string;
  notes?: string;
  hashVerification?: string;
}

export interface IntegrityReport {
  id: string;
  trackingCode: string; // e.g. WHISTLE-8941-X
  category: IntegrityCategory;
  title: string;
  description: string;
  departmentInvolved: string;
  suspectedPersonnel?: string;
  evidenceFiles: IntegrityEvidenceFile[];
  sha256MasterHash: string;
  latitude: number;
  longitude: number;
  address: string;
  capturedAt: string;
  submittedAt: string;
  status: IntegrityStatus;
  investigatorId?: string;
  investigatorName?: string;
  investigatorNotes?: string;
  accessLevel: 'RESTRICTED_INVESTIGATOR_ONLY';
  auditTrail: IntegrityAuditStep[];
}

export interface DepartmentStats {
  id: string;
  name: string;
  code: string;
  headName: string;
  activeOfficersCount: number;
  totalAssigned: number;
  resolvedCount: number;
  pendingCount: number;
  averageResolutionHours: number;
  slaComplianceRate: number; // percentage e.g. 94.2
  citizenSatisfactionScore: number; // 0 - 5.0
  color: string;
}

export interface AnalyticsOverview {
  totalIssues: number;
  pendingIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  verifiedIssues: number;
  criticalAlertsCount: number;
  integrityReportsCount: number;
  averageResolutionHours: number;
  overallSatisfaction: number;
  duplicateMergedCount: number;
  departmentStats: DepartmentStats[];
  categoryDistribution: { category: string; count: number; percentage: number }[];
  statusDistribution: { status: IssueStatus; count: number }[];
  resolutionVelocityTrend: { month: string; reported: number; resolved: number }[];
  recurringProblemSpots: {
    spotName: string;
    latitude: number;
    longitude: number;
    incidentCount: number;
    primaryCategory: string;
    urgencyLevel: 'Critical' | 'High' | 'Medium';
  }[];
}

// ============================================================================
// ONLINE THREAT & CYBER HARASSMENT MODULE TYPES
// ============================================================================

export type ThreatCategory =
  | 'DOXXING'
  | 'CYBERSTALKING'
  | 'EXPLICIT_THREATS'
  | 'EXTORTION_SEXTORTION'
  | 'IMPERSONATION'
  | 'NON_CONSENSUAL_IMAGERY'
  | 'TARGETED_HARASSMENT'
  | 'OTHER';

export type ThreatPlatform =
  | 'TWITTER_X'
  | 'WHATSAPP'
  | 'INSTAGRAM'
  | 'TELEGRAM'
  | 'DARK_WEB'
  | 'DISCORD'
  | 'REDDIT'
  | 'FACEBOOK'
  | 'OTHER';

export type ThreatStatus =
  | 'SUBMITTED'
  | 'AI_EVALUATED'
  | 'UNDER_INVESTIGATION'
  | 'ESCALATED_TO_CYBER_CELL'
  | 'ACTION_TAKEN'
  | 'RESOLVED'
  | 'CLOSED';

export interface ThreatEvidenceFile {
  id?: string;
  fileName: string;
  fileHash: string; // SHA-256 hash
  mimeType: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  previewUrl?: string;
  fileData?: string; // Base64 data if uploaded
  extractedText?: string; // OCR extracted text from this specific file
  ocrConfidence?: number;
}

export interface LegalStatute {
  section: string;
  act: string;
  title: string;
  description: string;
  punishment: string;
  cognizable: boolean;
  bailable: boolean;
  relevanceReason: string;
}

export interface ComplainantContact {
  name: string;
  email: string;
  phone: string;
  preferredContact?: 'EMAIL' | 'PHONE' | 'SECURE_IN_APP' | 'DO_NOT_CONTACT';
  safeCallbackHours?: string;
}

export interface ThreatIncidentMeta {
  platform: ThreatPlatform | string;
  suspectHandle?: string;
  suspectProfileUrl?: string;
  suspectContactInfo?: string;
  incidentTimestamp: string;
  narrative: string;
  repeatOffender?: boolean;
  priorComplaintsFiled?: boolean;
}

export interface ThreatAIAnalysis {
  severityScore: number; // 0.0 to 1.0
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  threatIntent: string;
  riskFactors: string[];
  extractedKeywords: string[];
  immediateSafetyActions: string[];
  lawEnforcementRecommendation: string;
  confidenceScore: number;
  summary: string;
}

export interface LegalComplaintDossier {
  dossierId: string;
  generatedAt: string;
  jurisdiction: string;
  statutorySummary: string;
  victimStatement: string;
  accusedParticulars: {
    handle: string;
    profileUrl: string;
    platform: string;
    additionalIdentifiers: string;
  };
  evidenceRegistry: {
    fileName: string;
    sha256Hash: string;
    mimeType: string;
    ocrSummary?: string;
  }[];
  applicableLaws: LegalStatute[];
  recommendedFIRSections: string[];
  investigatingOfficerChecklist: string[];
  preservationNoticeNoticeText: string;
  chainOfCustodyProof: string;
}

export interface CyberThreatReport {
  id: string;
  ticketId: string; // e.g. "CYBER-2026-89412"
  isAnonymous: boolean;
  complainantContact?: ComplainantContact;
  threatCategory: ThreatCategory;
  incidentMeta: ThreatIncidentMeta;
  evidenceFiles: ThreatEvidenceFile[];
  severityScore: number; // 0.0 to 1.0
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  legalSectionsFlagged: LegalStatute[];
  hashDigest: string; // Master SHA-256 digest
  extractedText?: string;
  aiAnalysis?: ThreatAIAnalysis;
  legalDossier?: LegalComplaintDossier;
  status: ThreatStatus;
  statusNotes?: string;
  assignedInvestigator?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThreatSubmissionPayload {
  isAnonymous: boolean;
  complainantContact?: ComplainantContact;
  threatCategory: ThreatCategory | string;
  incidentMeta: ThreatIncidentMeta;
  evidenceFiles: ThreatEvidenceFile[];
}
