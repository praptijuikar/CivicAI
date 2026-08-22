import type {
  CivicIssue,
  IntegrityReport,
  AnalyticsOverview,
  User,
  DepartmentStats,
  AIAnalysisResult,
} from "../types.ts";

export const api = {
  // Auth
  getUsers: async (): Promise<{ users: User[] }> => {
    const res = await fetch("/api/v1/auth/users");
    return res.json();
  },

  login: async (email?: string, role?: string): Promise<{ token: string; user: User }> => {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    return res.json();
  },

  // Issues
  getIssues: async (filters?: {
    status?: string;
    category?: string;
    department?: string;
    severity?: string;
    search?: string;
    userId?: string;
  }): Promise<{ issues: CivicIssue[]; total: number }> => {
    const query = new URLSearchParams();
    if (filters?.status) query.set("status", filters.status);
    if (filters?.category) query.set("category", filters.category);
    if (filters?.department) query.set("department", filters.department);
    if (filters?.severity) query.set("severity", filters.severity);
    if (filters?.search) query.set("search", filters.search);
    if (filters?.userId) query.set("userId", filters.userId);

    const res = await fetch(`/api/v1/issues?${query.toString()}`);
    return res.json();
  },

  getIssueById: async (id: string): Promise<{ issue: CivicIssue }> => {
    const res = await fetch(`/api/v1/issues/${id}`);
    return res.json();
  },

  analyzeImage: async (
    imageBase64: string,
    mimeType?: string,
    description?: string
  ): Promise<{ analysis: AIAnalysisResult }> => {
    const res = await fetch("/api/v1/issues/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType, description }),
    });
    if (!res.ok) {
      throw new Error("AI Visual analysis failed");
    }
    return res.json();
  },

  checkDuplicates: async (
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
  }> => {
    const res = await fetch("/api/v1/issues/duplicate-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude, category, radiusMeters }),
    });
    return res.json();
  },

  createIssue: async (issueData: Partial<CivicIssue>): Promise<{ issue: CivicIssue; message: string }> => {
    const res = await fetch("/api/v1/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(issueData),
    });
    return res.json();
  },

  upvoteIssue: async (id: string, userId?: string): Promise<{ issue: CivicIssue; message: string }> => {
    const res = await fetch(`/api/v1/issues/${id}/upvote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  assignIssue: async (
    id: string,
    payload: {
      department: string;
      officerId?: string;
      officerName?: string;
      slaHours?: number;
      deadlineAt?: string;
      adminNotes?: string;
    }
  ): Promise<{ issue: CivicIssue; message: string }> => {
    const res = await fetch(`/api/v1/issues/${id}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  startWork: async (
    id: string,
    payload: { officerName?: string; beforeImageUrl?: string }
  ): Promise<{ issue: CivicIssue; message: string }> => {
    const res = await fetch(`/api/v1/issues/${id}/start-work`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  resolveIssue: async (
    id: string,
    payload: {
      officerId?: string;
      officerName?: string;
      notes?: string;
      afterImageUrl?: string;
      materialsUsed?: string[];
    }
  ): Promise<{ issue: CivicIssue; message: string }> => {
    const res = await fetch(`/api/v1/issues/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  verifyIssue: async (
    id: string,
    payload: { isSatisfied: boolean; verificationNotes?: string; citizenName?: string }
  ): Promise<{ issue: CivicIssue; message: string }> => {
    const res = await fetch(`/api/v1/issues/${id}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Integrity Reports
  getIntegrityReports: async (): Promise<{ reports: IntegrityReport[]; count: number }> => {
    const res = await fetch("/api/v1/integrity-reports");
    return res.json();
  },

  createIntegrityReport: async (
    payload: Partial<IntegrityReport>
  ): Promise<{ report: IntegrityReport; trackingCode: string; sha256MasterHash: string; message: string }> => {
    const res = await fetch("/api/v1/integrity-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  updateIntegrityReport: async (
    id: string,
    payload: {
      status?: string;
      investigatorNotes?: string;
      investigatorId?: string;
      investigatorName?: string;
      newAuditStep?: { stepName: string; notes?: string };
    }
  ): Promise<{ report: IntegrityReport; message: string }> => {
    const res = await fetch(`/api/v1/integrity-reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Analytics
  getAnalytics: async (): Promise<{ analytics: AnalyticsOverview }> => {
    const res = await fetch("/api/v1/analytics/overview");
    return res.json();
  },

  getDepartments: async (): Promise<{ departments: DepartmentStats[] }> => {
    const res = await fetch("/api/v1/departments");
    return res.json();
  },

  getOfficers: async (): Promise<{ officers: User[] }> => {
    const res = await fetch("/api/v1/officers");
    return res.json();
  },
};
