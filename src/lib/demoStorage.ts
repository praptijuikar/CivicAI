import type { CivicIssue } from "../types";
import type { ComplaintRecord } from "./complaintData";

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

const COMPLAINTS_KEY = "civicai-demo-complaints";

export const MOCK_COMPLAINTS: ComplaintRecord[] = [
  {
    id: "FHS-10001",
    category: "Food & Health Standards",
    subType: "Unhygienic Conditions",
    establishmentName: "Dragon Palace Restaurant",
    description: "Kitchen area visible from entrance with open drain and flies. Staff not wearing gloves.",
    severity: "High",
    latitude: 37.7762,
    longitude: -122.4183,
    incidentAt: new Date(Date.now() - 86400000).toISOString(),
    reportedAt: new Date(Date.now() - 82800000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&q=80&w=400",
    status: "Under Review",
  },
  {
    id: "FHS-10002",
    category: "Food & Health Standards",
    subType: "Food Poisoning / Expired Food",
    establishmentName: "QuickBite Deli",
    description: "Multiple customers reported food poisoning after consuming sandwiches on 28 Aug. Expiry dates not visible.",
    severity: "Critical",
    latitude: 37.7738,
    longitude: -122.4210,
    incidentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    reportedAt: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
    imageUrl: undefined,
    status: "Escalated",
  },
  {
    id: "FHS-10003",
    category: "Food & Health Standards",
    subType: "Unhygienic Conditions",
    establishmentName: "Street Cart – Corner of Oak & 3rd",
    description: "Unlicensed mobile cart selling raw seafood without refrigeration. No health permit displayed.",
    severity: "Medium",
    latitude: 37.7753,
    longitude: -122.4170,
    incidentAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reportedAt: new Date(Date.now() - 86400000 * 3 + 1800000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400",
    status: "Reported",
  },
  {
    id: "FHS-10004",
    category: "Food & Health Standards",
    subType: "Unhygienic Conditions",
    establishmentName: "Sunrise Bakery",
    description: "Rodent droppings found near bread display shelves. Pest sighting reported by two separate customers.",
    severity: "High",
    latitude: 37.7745,
    longitude: -122.4225,
    incidentAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    reportedAt: new Date(Date.now() - 86400000 * 4 + 7200000).toISOString(),
    imageUrl: undefined,
    status: "Resolved",
  },
  {
    id: "TRF-10001",
    category: "Traffic Jam",
    subType: "Broken Traffic Light",
    establishmentName: "5th Ave & Market St",
    description: "Traffic signal stuck on red, causing major gridlock at peak hours.",
    severity: "High",
    latitude: 37.7770,
    longitude: -122.4160,
    incidentAt: new Date(Date.now() - 3600000).toISOString(),
    reportedAt: new Date(Date.now() - 3000000).toISOString(),
    imageUrl: undefined,
    status: "Under Review",
  },
  {
    id: "PKG-10001",
    category: "Illegal Parking",
    subType: "Blocking Driveway",
    establishmentName: "22 Elm Street",
    description: "Red pickup truck (plate: XYZ-4455) blocking residential driveway for 2+ hours.",
    severity: "Medium",
    latitude: 37.7735,
    longitude: -122.4190,
    incidentAt: new Date(Date.now() - 7200000).toISOString(),
    reportedAt: new Date(Date.now() - 6800000).toISOString(),
    imageUrl: undefined,
    status: "Reported",
  },
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

export function loadDemoComplaints(): ComplaintRecord[] {
  try {
    const stored = localStorage.getItem(COMPLAINTS_KEY);
    if (!stored) {
      localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(MOCK_COMPLAINTS));
      return MOCK_COMPLAINTS;
    }
    const records = JSON.parse(stored) as ComplaintRecord[];
    return Array.isArray(records) && records.length > 0 ? records : MOCK_COMPLAINTS;
  } catch {
    return MOCK_COMPLAINTS;
  }
}

export function saveDemoComplaint(record: ComplaintRecord): ComplaintRecord[] {
  const all = [record, ...loadDemoComplaints().filter((r) => r.id !== record.id)];
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(all));
  return all;
}
