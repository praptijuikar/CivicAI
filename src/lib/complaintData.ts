// ─── Complaint Category & Sub-type Registry ────────────────────────────────
// Single source of truth shared by TrafficReportForm and ComplaintMap.

export type ComplaintCategory =
  | "Food & Health Safety"
  | "Traffic Jam"
  | "Illegal Parking";

export type FoodHealthSubType =
  | "Unhygienic Conditions"
  | "Food Poisoning / Expired Food"
  | "Hospital Negligence / Malpractice"
  | "Lack of Medical Staff / Doctor Absence"
  | "Overcharging / Billing Fraud in Hospital"
  | "Unclean Hospital Facility / Ward Sanitation"
  | "Unavailability of Essential Medicines"
  | "Illegal Waste / Sewage Dumping";

export type TrafficSubType =
  | "Gridlock"
  | "Broken Traffic Light"
  | "Road Construction"
  | "Accident";

export type ParkingSubType =
  | "Blocking Driveway"
  | "No Parking Zone"
  | "Sidewalk Obstruction"
  | "Double Parking";

export type ComplaintSubType = FoodHealthSubType | TrafficSubType | ParkingSubType;

export type SeverityLevel = "Low" | "Medium" | "High" | "Critical";

export const SEVERITY_LEVELS: SeverityLevel[] = ["Low", "Medium", "High", "Critical"];

export const SEVERITY_CONFIG: Record<
  SeverityLevel,
  { color: string; bg: string; border: string; dot: string }
> = {
  Low:      { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  Medium:   { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   dot: "bg-amber-400"   },
  High:     { color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  dot: "bg-orange-400"  },
  Critical: { color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/30",    dot: "bg-rose-400"    },
};

export const COMPLAINT_CATEGORY_CONFIG: Record<
  ComplaintCategory,
  {
    label: string;
    emoji: string;
    markerColor: string;       // CSS hex for Leaflet divIcon
    markerBg: string;          // Tailwind class for UI
    markerBorder: string;      // Tailwind class for UI
    markerText: string;        // Tailwind class for UI
    subTypes: ComplaintSubType[];
    descriptionPlaceholder: string;
    refPrefix: string;
  }
> = {
  "Food & Health Safety": {
    label: "Food & Health Safety",
    emoji: "🟢",
    markerColor: "#22c55e",
    markerBg: "bg-emerald-500/10",
    markerBorder: "border-emerald-500/40",
    markerText: "text-emerald-400",
    subTypes: [
      "Unhygienic Conditions",
      "Food Poisoning / Expired Food",
      "Hospital Negligence / Malpractice",
      "Lack of Medical Staff / Doctor Absence",
      "Overcharging / Billing Fraud in Hospital",
      "Unclean Hospital Facility / Ward Sanitation",
      "Unavailability of Essential Medicines",
      "Illegal Waste / Sewage Dumping",
    ],
    descriptionPlaceholder:
      "E.g. Restaurant or hospital name, nature of hazard, medical details, number of people affected…",
    refPrefix: "FHS",
  },
  "Traffic Jam": {
    label: "Traffic Jam",
    emoji: "🔴",
    markerColor: "#ef4444",
    markerBg: "bg-red-500/10",
    markerBorder: "border-red-500/40",
    markerText: "text-red-400",
    subTypes: ["Gridlock", "Broken Traffic Light", "Road Construction", "Accident"],
    descriptionPlaceholder:
      "E.g. Street name, direction affected, duration of jam…",
    refPrefix: "TRF",
  },
  "Illegal Parking": {
    label: "Illegal Parking",
    emoji: "🟠",
    markerColor: "#f97316",
    markerBg: "bg-orange-500/10",
    markerBorder: "border-orange-500/40",
    markerText: "text-orange-400",
    subTypes: [
      "Blocking Driveway",
      "No Parking Zone",
      "Sidewalk Obstruction",
      "Double Parking",
    ],
    descriptionPlaceholder:
      "E.g. Vehicle plate number, colour, make of vehicle…",
    refPrefix: "PKG",
  },
};

export const ALL_CATEGORIES = Object.keys(
  COMPLAINT_CATEGORY_CONFIG
) as ComplaintCategory[];

// ─── Complaint Record (stored / mapped) ────────────────────────────────────

export interface ComplaintRecord {
  id: string;
  category: ComplaintCategory;
  subType: ComplaintSubType;
  establishmentName: string;
  description: string;
  severity: SeverityLevel;
  latitude: number;
  longitude: number;
  incidentAt: string;     // ISO datetime
  reportedAt: string;     // ISO datetime
  imageUrl?: string;      // base64 or remote URL
  imageFileName?: string;
  status: "Reported" | "Under Review" | "Escalated" | "Resolved";
}
