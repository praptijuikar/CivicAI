export type UserRole = 'citizen' | 'admin' | 'officer' | 'investigator';

export type Language = 'en' | 'hi' | 'es' | 'bn';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  departmentId?: string;
  departmentName?: string;
  badgeNumber?: string;
  phone?: string;
  reputationScore?: number;
  activeTasksCount?: number;
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
  | 'reopened';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface AIAnalysisResult {
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
  id: string;
  userId: string;
  reporterName: string;
  isAnonymous?: boolean;
  reporterContact?: string;
  title: string;
  category: string;
  subcategory: string;
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
