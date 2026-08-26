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

export function loadDemoReports(): CivicIssue[] {
  try {
    const stored = localStorage.getItem(REPORTS_KEY);
    if (!stored) return [];
    const reports = JSON.parse(stored) as CivicIssue[];
    return Array.isArray(reports) ? reports : [];
  } catch {
    return [];
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
