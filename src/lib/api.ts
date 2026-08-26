import type {
  CivicIssue,
  IntegrityReport,
  AnalyticsOverview,
  User,
  DepartmentStats,
  AIAnalysisResult,
} from "../types.ts";

/**
 * Custom error class for API response errors
 */
export class ApiError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Base configuration and HTTP client helper
 */
const API_URL = import.meta.env.VITE_API_URL || '';
const BASE_URL = (API_URL || "https://civicai-production.up.railway.app").replace(/\/api\/?$/, "");
async function httpClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  // Auto-inject JSON Content-Type if payload exists
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const language = typeof window !== "undefined" ? localStorage.getItem("civicai-language") : null;
  if (language && !headers.has("Accept-Language")) headers.set("Accept-Language", language);
  if (typeof navigator !== "undefined" && !navigator.onLine) headers.set("X-Offline-Client", "true");

  let response: Response;
  try {
    const isAbsoluteURL = /^https?:\/\//i.test(path);
    const requestUrl = isAbsoluteURL
      ? path
      : `${BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

    response = await fetch(requestUrl, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new ApiError(
      `Unable to reach the CivicAI API at ${BASE_URL}. Check the backend URL, deployment status, and CORS settings.`,
      500
    );
  }

  // Handle non-2xx HTTP status codes
  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // Fallback if response body is empty or non-JSON (e.g. HTML error page)
      errorData = { message: response.statusText || "An unexpected error occurred." };
    }

    throw new ApiError(
      errorData.message || errorData.error || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

/**
 * Helper to build clean URL query strings from parameters
 */
function buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return "";
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Refactored CivicAI API Service
 */
export const api = {
  // --- Issues ---
  getIssues: (filters?: {
    status?: string;
    category?: string;
    department?: string;
    severity?: string;
    search?: string;
    userId?: string;
  }): Promise<{ issues: CivicIssue[]; total: number }> =>
    httpClient(`/api/v1/issues${buildQueryString(filters)}`),

  getSystemicIssueGroups: (days = 7): Promise<{
    days: number;
    groups: { category: string; subcategory: string; location: string; count: number; issueIds: string[]; userIds: string[] }[];
  }> => httpClient(`/api/v1/issues/systemic-groups${buildQueryString({ days })}`),

  getPublicTransparency: (): Promise<{ generatedAt: string; totalComplaints: number; averageResolutionHours: number; byStatus: Record<string, number>; byCategory: Record<string, number>; activeIssueLocations: { latitude: number; longitude: number; category: string }[] }> =>
    httpClient("/api/v1/public/transparency"),

  getAuditLogs: (): Promise<{ entries: unknown[]; integrity: { valid: boolean; checkedEntries: number; brokenSequence?: number } }> =>
    httpClient("/api/v1/audit/logs"),

  allocateBudget: (payload: { budgetCap: number; crisisMode?: boolean; crisisCategories?: string[]; neglectedWards?: string[] }): Promise<{
    allocation: {
      budgetCap: number;
      allocatedCost: number;
      remainingBudget: number;
      totalImpact: number;
      selected: { issueId: string; estimatedCost: number; adjustedScore: number; reason: string }[];
      deferred: { issueId: string; estimatedCost: number; adjustedScore: number; reason: string }[];
      audit: { generatedAt: string; formula: string; crisisMode: boolean; crisisMultiplier: number; equityBoost: number; selectedCount: number; deferredCount: number };
    };
  }> => httpClient("/api/v1/budget/allocate", { method: "POST", body: JSON.stringify(payload) }),

  getIssueById: (id: string): Promise<{ issue: CivicIssue }> =>
    httpClient(`/api/v1/issues/${id}`),

  deleteIssue: (id: string): Promise<{ message: string; issueId: string }> =>
    httpClient(`/api/v1/issues/${id}`, { method: "DELETE" }),

  analyzeImage: (
    imageBase64: string,
    mimeType?: string,
    description?: string
  ): Promise<{ analysis: AIAnalysisResult }> =>
    httpClient("/api/v1/issues/analyze-image", {
      method: "POST",
      body: JSON.stringify({ imageBase64, mimeType, description }),
    }),

  checkDuplicates: (
    latitude: number,
    longitude: number,
    category?: string,
    radiusMeters?: number
  ): Promise<{
    hasDuplicates: boolean;
    count: number;
    duplicates: {
      issue: CivicIssue;
      distanceMeters: number;
      isNearby: boolean;
      isSameCategory: boolean;
    }[];
  }> =>
    httpClient("/api/v1/issues/duplicate-check", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude, category, radiusMeters }),
    }),

  createIssue: (issueData: Partial<CivicIssue>): Promise<{
    issue?: CivicIssue;
    message: string;
    status?: "queued";
    confirmationToken?: string;
  }> =>
    httpClient("/api/v1/issues", {
      method: "POST",
      body: JSON.stringify(issueData),
    }),

  getComplaintQueueStatus: (token: string): Promise<{ status: string; confirmationToken: string; issueId?: string; error?: string; updatedAt: string }> =>
    httpClient(`/api/v1/issues/queue/${encodeURIComponent(token)}`),

  uploadIssueMediaChunk: (issueId: string, payload: { chunkIndex: number; totalChunks: number; data: string }): Promise<{ complete: boolean; issue?: CivicIssue }> =>
    httpClient(`/api/v1/issues/${issueId}/media/chunks`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  upvoteIssue: (id: string, userId?: string): Promise<{ issue: CivicIssue; message: string }> =>
    httpClient(`/api/v1/issues/${id}/upvote`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  assignIssue: (
    id: string,
    payload: {
      department: string;
      officerId?: string;
      officerName?: string;
      slaHours?: number;
      deadlineAt?: string;
      adminNotes?: string;
    }
  ): Promise<{ issue: CivicIssue; message: string }> =>
    httpClient(`/api/v1/issues/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  startWork: (
    id: string,
    payload: { officerName?: string; beforeImageUrl?: string }
  ): Promise<{ issue: CivicIssue; message: string }> =>
    httpClient(`/api/v1/issues/${id}/start-work`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  resolveIssue: (
    id: string,
    payload: {
      officerId?: string;
      officerName?: string;
      notes?: string;
      afterImageUrl?: string;
      materialsUsed?: string[];
    }
  ): Promise<{ issue: CivicIssue; message: string }> =>
    httpClient(`/api/v1/issues/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verifyIssue: (
    id: string,
    payload: { isSatisfied: boolean; verificationNotes?: string; citizenName?: string }
  ): Promise<{ issue: CivicIssue; message: string }> =>
    httpClient(`/api/v1/issues/${id}/verify`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // --- Integrity Reports ---
  getIntegrityReports: (): Promise<{ reports: IntegrityReport[]; count: number }> =>
    httpClient("/api/v1/integrity-reports"),

  createIntegrityReport: (
    payload: Partial<IntegrityReport>
  ): Promise<{ report: IntegrityReport; trackingCode: string; sha256MasterHash: string; message: string }> =>
    httpClient("/api/v1/integrity-reports", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateIntegrityReport: (
    id: string,
    payload: {
      status?: string;
      investigatorNotes?: string;
      investigatorId?: string;
      investigatorName?: string;
      newAuditStep?: { stepName: string; notes?: string };
    }
  ): Promise<{ report: IntegrityReport; message: string }> =>
    httpClient(`/api/v1/integrity-reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // --- Analytics & Resources ---
  getAnalytics: (): Promise<{ analytics: AnalyticsOverview }> =>
    httpClient("/api/v1/analytics/overview"),

  getDepartments: (): Promise<{ departments: DepartmentStats[] }> =>
    httpClient("/api/v1/departments"),

  getOfficers: (): Promise<{ officers: User[] }> =>
    httpClient("/api/v1/officers"),
};