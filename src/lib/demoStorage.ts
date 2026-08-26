import type { CivicIssue } from "../types";

const REPORTS_KEY = "civicai-demo-reports";

export function createDemoReportId(): string {
  const existingIds = new Set(loadDemoReports().map((report) => report.id));
  let id = "";
  do {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    id = `CIV-${year}-${random}`;
  } while (existingIds.has(id));
  return id;
}

const MOCK_ISSUES: CivicIssue[] = [
  {
    id: "CIV-2026-1001",
    title: "Deep Pothole on Main St",
    description: "A large pothole has developed in the right lane, causing damage to multiple vehicles.",
    category: "Infrastructure",
    subcategory: "Road Repair",
    status: "in_progress",
    severity: "High",
    latitude: 37.7749,
    longitude: -122.4194,
    locationAddress: "123 Main St, Downtown",
    address: "123 Main St, Downtown",
    userId: "usr-citizen-demo",
    reporterName: "Demo Citizen",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    initialImageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400",
    upvotesCount: 24,
    upvotes: 24,
    aiUrgencyScore: 8.5,
    priorityScore: 85,
    reportCount: 1,
    history: []
  },
  {
    id: "CIV-2026-1002",
    title: "Streetlight Broken near Park",
    description: "The streetlights on the north side of the park have been out for 3 days, making it unsafe at night.",
    category: "Utilities",
    subcategory: "Lighting",
    status: "submitted",
    severity: "Medium",
    latitude: 37.7750,
    longitude: -122.4180,
    locationAddress: "North Park Avenue",
    address: "North Park Avenue",
    userId: "usr-citizen-demo",
    reporterName: "Demo Citizen",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    initialImageUrl: undefined,
    upvotesCount: 12,
    upvotes: 12,
    aiUrgencyScore: 5.2,
    priorityScore: 52,
    reportCount: 1,
    history: []
  },
  {
    id: "CIV-2026-1003",
    title: "Garbage collection delayed",
    description: "Trash bins haven't been emptied this week in the entire neighborhood block.",
    category: "Sanitation",
    subcategory: "Waste Collection",
    status: "resolved",
    severity: "Low",
    latitude: 37.7730,
    longitude: -122.4200,
    locationAddress: "Sunset District Block 4",
    address: "Sunset District Block 4",
    userId: "usr-citizen-demo",
    reporterName: "Demo Citizen",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    initialImageUrl: undefined,
    upvotesCount: 8,
    upvotes: 8,
    aiUrgencyScore: 2.1,
    priorityScore: 21,
    reportCount: 1,
    history: []
  }
];

export function loadDemoReports(): CivicIssue[] {
  try {
    const stored = localStorage.getItem(REPORTS_KEY);
    if (!stored) {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(MOCK_ISSUES));
      return MOCK_ISSUES;
    }
    const reports = JSON.parse(stored) as CivicIssue[];
    return (Array.isArray(reports) && reports.length > 0) ? reports : MOCK_ISSUES;
  } catch {
    return MOCK_ISSUES;
  }
}

export function saveDemoReport(report: CivicIssue): CivicIssue[] {
  const reports = [report, ...loadDemoReports().filter((existing) => existing.id !== report.id)];
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  return reports;
}

export function updateDemoReport(report: CivicIssue): CivicIssue[] {
  return saveDemoReport(report);
}
