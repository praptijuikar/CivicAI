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
const BASE_URL = (import.meta as any).env?.VITE_API_URL || "https://civicai-production.up.railway.app";

async function httpClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = new Headers(options.headers);

  // Auto-inject JSON Content-Type if payload exists
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Auto-inject Authorization Bearer token
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

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
      errorData.message || `Request failed with status ${response.status}`,
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
  // --- Auth ---
  getUsers: (): Promise<{ users: User[] }> => 
    httpClient("/api/v1/auth/users"),

  login: (email?: string, role?: string): Promise<{ token: string; user: User }> =>
    httpClient("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),

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

  getIssueById: (id: string): Promise<{ issue: CivicIssue }> =>
    httpClient(`/api/v1/issues/${id}`),

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
      confidence: number;
    }[];
  }> =>
    httpClient("/api/v1/issues/duplicate-check", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude, category, radiusMeters }),
    }),

  createIssue: (issueData: Partial<CivicIssue>): Promise<{ issue: CivicIssue; message: string }> =>
    httpClient("/api/v1/issues", {
      method: "POST",
      body: JSON.stringify(issueData),
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