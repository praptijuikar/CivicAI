import crypto from "crypto";
import type {
  CivicIssue,
  IntegrityReport,
  User,
  DepartmentStats,
  AnalyticsOverview,
  IssueStatus,
  Severity,
} from "../src/types.ts";

export const USERS: User[] = [
  {
    id: "usr-citizen-01",
    name: "Aria Montgomery",
    email: "citizen@civic.gov",
    role: "citizen",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    phone: "+1 (555) 234-8901",
    reputationScore: 98,
    createdAt: "2025-11-10T08:30:00Z",
  },
  {
    id: "usr-admin-01",
    name: "Director Marcus Vance",
    email: "admin@civic.gov",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    departmentName: "Municipal Operations Center",
    phone: "+1 (555) 901-4455",
    badgeNumber: "ADM-9042",
    createdAt: "2024-02-15T09:00:00Z",
  },
  {
    id: "usr-officer-01",
    name: "Officer Sarah Chen",
    email: "officer@civic.gov",
    role: "officer",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    departmentId: "dept-public-works",
    departmentName: "Department of Public Works",
    badgeNumber: "DPW-Field-418",
    phone: "+1 (555) 678-1290",
    createdAt: "2025-01-20T10:15:00Z",
  },
  {
    id: "usr-officer-02",
    name: "Officer Tariq Al-Mansoor",
    email: "tariq.officer@civic.gov",
    role: "officer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    departmentId: "dept-water-sewage",
    departmentName: "Water Supply & Sewerage Board",
    badgeNumber: "WTR-Eng-209",
    phone: "+1 (555) 345-9921",
    createdAt: "2025-03-01T11:00:00Z",
  },
  {
    id: "usr-investigator-01",
    name: "Inspector Elena Rostova",
    email: "investigator@civic.gov",
    role: "investigator",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    departmentName: "Office of Public Integrity & Anti-Corruption",
    badgeNumber: "IA-Oversight-007",
    phone: "+1 (555) 999-0012",
    createdAt: "2024-06-18T14:20:00Z",
  },
];

export const DEPARTMENTS: DepartmentStats[] = [
  {
    id: "dept-public-works",
    name: "Department of Public Works",
    code: "DPW",
    headName: "Elena Rostova (Acting)",
    activeOfficersCount: 24,
    totalAssigned: 142,
    resolvedCount: 119,
    pendingCount: 23,
    averageResolutionHours: 19.4,
    slaComplianceRate: 94.8,
    citizenSatisfactionScore: 4.8,
    color: "#3b82f6", // Blue
  },
  {
    id: "dept-water-sewage",
    name: "Water Supply & Sewerage Board",
    code: "WTR",
    headName: "Eng. Ronald Sterling",
    activeOfficersCount: 18,
    totalAssigned: 98,
    resolvedCount: 81,
    pendingCount: 17,
    averageResolutionHours: 14.2,
    slaComplianceRate: 96.1,
    citizenSatisfactionScore: 4.9,
    color: "#06b6d4", // Cyan
  },
  {
    id: "dept-sanitation",
    name: "Municipal Solid Waste Management",
    code: "SWM",
    headName: "Chief Brenda Vance",
    activeOfficersCount: 32,
    totalAssigned: 215,
    resolvedCount: 194,
    pendingCount: 21,
    averageResolutionHours: 8.6,
    slaComplianceRate: 97.4,
    citizenSatisfactionScore: 4.7,
    color: "#10b981", // Emerald
  },
  {
    id: "dept-electrical",
    name: "City Power & Electrical Services",
    code: "ELEC",
    headName: "Dr. Arvind Patel",
    activeOfficersCount: 15,
    totalAssigned: 76,
    resolvedCount: 68,
    pendingCount: 8,
    averageResolutionHours: 6.8,
    slaComplianceRate: 98.2,
    citizenSatisfactionScore: 4.9,
    color: "#f59e0b", // Amber
  },
  {
    id: "dept-parks",
    name: "Parks & Urban Forestry",
    code: "PARK",
    headName: "Claire Dupont",
    activeOfficersCount: 12,
    totalAssigned: 64,
    resolvedCount: 52,
    pendingCount: 12,
    averageResolutionHours: 32.5,
    slaComplianceRate: 91.0,
    citizenSatisfactionScore: 4.6,
    color: "#84cc16", // Lime
  },
  {
    id: "dept-safety",
    name: "Public Safety & Traffic Enforcement",
    code: "PSTE",
    headName: "Captain Jonathan Cross",
    activeOfficersCount: 20,
    totalAssigned: 110,
    resolvedCount: 96,
    pendingCount: 14,
    averageResolutionHours: 11.2,
    slaComplianceRate: 95.3,
    citizenSatisfactionScore: 4.8,
    color: "#ef4444", // Rose/Red
  },
];

// Helper to compute realistic SHA-256 evidence hash
export function generateSHA256Hash(payload: string): string {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function computePriorityScore(
  severity: Severity,
  locationRiskWeight: number = 20,
  publicImpactWeight: number = 15,
  duplicateCount: number = 1,
  ageInDays: number = 1
): number {
  let severityScore = 20;
  if (severity === "Critical") severityScore = 40;
  else if (severity === "High") severityScore = 32;
  else if (severity === "Medium") severityScore = 22;
  else if (severity === "Low") severityScore = 12;

  const dupBonus = Math.min(duplicateCount, 8) * 4;
  const ageBonus = Math.min(ageInDays, 7) * 2;

  const total = severityScore + locationRiskWeight + publicImpactWeight + dupBonus + ageBonus;
  return Math.min(100, Math.max(10, Math.round(total)));
}

// 32+ Initial Pre-seeded Civic Issues across all categories and metro neighborhoods
export let ISSUES: CivicIssue[] = [
  {
    id: "ISS-2026-0814",
    userId: "usr-citizen-01",
    reporterName: "Aria Montgomery",
    reporterContact: "+1 (555) 234-8901",
    title: "Deep Pothole with Exposed Rebar on Metro Transit Corridor",
    category: "Roads & Infrastructure",
    subcategory: "Major Pothole & Sub-base Damage",
    description: "Massive 90mm deep crater in the right northbound lane right before the express bus lane merge. Two vehicles sustained rim damage this morning during rush hour.",
    latitude: 37.7749,
    longitude: -122.4194,
    address: "742 Market St, Financial District, Downtown",
    landmark: "Across from Montgomery Plaza Subway Station",
    status: "in_progress",
    priorityScore: 94,
    severity: "Critical",
    reportCount: 5,
    upvotes: 28,
    upvotedUserIds: ["usr-citizen-01", "usr-citizen-02"],
    assignedDepartment: "Department of Public Works",
    assignedOfficerId: "usr-officer-01",
    assignedOfficerName: "Officer Sarah Chen",
    assignedOfficerPhone: "+1 (555) 678-1290",
    assignedAt: "2026-08-20T07:15:00Z",
    deadlineAt: "2026-08-20T19:00:00Z",
    slaHours: 12,
    initialImageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    beforeImageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      predictedCategory: "Roads & Infrastructure",
      subcategory: "Severe Pothole & Rebar Cavity",
      confidence: 0.98,
      severity: "Critical",
      calculatedPriorityScore: 94,
      safetyRisks: [
        "Immediate tire blowout and motorcycle loss of control",
        "Traffic bottleneck causing sudden deceleration shockwaves",
      ],
      recommendedDepartment: "Department of Public Works",
      estimatedResolutionHours: 8,
      suggestedEquipment: [
        "Hot-Mix Asphalt Patching Trailer",
        "Vibratory Asphalt Roller",
        "Pneumatic Jackhammer & Tack Coat",
      ],
      actionChecklist: [
        "Deploy reflective cones 40m upstream",
        "Sawcut perimeter 100mm beyond cracked asphalt",
        "Apply rubberized binder tack & compact hot asphalt to grade",
      ],
      summary: "Critical structural pavement depression threatening transit artery. Rapid dispatch assigned to DPW Crew #3.",
    },
    history: [
      {
        id: "hist-01",
        timestamp: "2026-08-20T06:45:00Z",
        action: "Issue Reported",
        actorName: "Aria Montgomery",
        actorRole: "citizen",
        details: "Initial submission via Citizen Portal with camera GPS verification.",
      },
      {
        id: "hist-02",
        timestamp: "2026-08-20T06:46:00Z",
        action: "AI Visual Triage Completed",
        actorName: "CivicAI Neural Engine",
        actorRole: "admin",
        details: "Assigned Critical severity (0.98 confidence), computed 94 priority score.",
      },
      {
        id: "hist-03",
        timestamp: "2026-08-20T07:15:00Z",
        action: "Dispatched to Field Officer",
        actorName: "Director Marcus Vance",
        actorRole: "admin",
        details: "Automated routing approved. Officer Sarah Chen assigned with 12h SLA.",
      },
    ],
    createdAt: "2026-08-20T06:45:00Z",
    updatedAt: "2026-08-20T07:15:00Z",
  },
  {
    id: "ISS-2026-0813",
    userId: "usr-citizen-01",
    reporterName: "David Kim",
    title: "High-Pressure Water Main Rupture with Street Flooding",
    category: "Water & Sewage",
    subcategory: "Pressurized Pipeline Rupture",
    description: "Clean water gushing from underground joint under the pedestrian sidewalk. Water is pooling across two lanes and undermining paving stones.",
    latitude: 37.7833,
    longitude: -122.4167,
    address: "420 Geary St, Theater District",
    landmark: "Adjacent to Curran Theater entrance",
    status: "assigned",
    priorityScore: 91,
    severity: "Critical",
    reportCount: 3,
    upvotes: 19,
    assignedDepartment: "Water Supply & Sewerage Board",
    assignedOfficerId: "usr-officer-02",
    assignedOfficerName: "Officer Tariq Al-Mansoor",
    assignedAt: "2026-08-20T08:00:00Z",
    deadlineAt: "2026-08-20T14:00:00Z",
    slaHours: 6,
    initialImageUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      predictedCategory: "Water & Sewage",
      subcategory: "Main Pipe Rupture",
      confidence: 0.96,
      severity: "Critical",
      calculatedPriorityScore: 91,
      safetyRisks: [
        "Sub-surface void formation causing potential sinkhole",
        "Contamination risk to municipal water pressure network",
      ],
      recommendedDepartment: "Water Supply & Sewerage Board",
      estimatedResolutionHours: 6,
      suggestedEquipment: ["Trenching Backhoe", "Submersible Pump", "Emergency Pipe Sleeve Clamp"],
      actionChecklist: [
        "Isolate Valve Box #G-44",
        "Shoring trench for safe repair entry",
        "Install 6-inch ductile iron replacement section",
      ],
      summary: "High volume pressurized clean water leak compromising pedestrian zone subgrade.",
    },
    history: [
      {
        id: "hist-11",
        timestamp: "2026-08-20T07:30:00Z",
        action: "Reported",
        actorName: "David Kim",
        actorRole: "citizen",
        details: "Reported with live video clip & GPS.",
      },
      {
        id: "hist-12",
        timestamp: "2026-08-20T08:00:00Z",
        action: "Emergency Assignment",
        actorName: "Director Marcus Vance",
        actorRole: "admin",
        details: "Assigned to Water Rapid Response Team.",
      },
    ],
    createdAt: "2026-08-20T07:30:00Z",
    updatedAt: "2026-08-20T08:00:00Z",
  },
  {
    id: "ISS-2026-0810",
    userId: "usr-citizen-01",
    reporterName: "Mei Lin",
    title: "Broken Streetlight Mast & Dangling Exposed Wiring",
    category: "Electrical & Lighting",
    subcategory: "Fallen Light Pole / Live Cable",
    description: "Collision damage knocked pole at 45 degree angle. Lower access hatch is open with exposed 240V wire bundle dangling over bike path.",
    latitude: 37.7698,
    longitude: -122.4467,
    address: "1280 Haight St, The Haight",
    landmark: "Corner of Haight & Ashbury",
    status: "resolved",
    priorityScore: 89,
    severity: "Critical",
    reportCount: 7,
    upvotes: 34,
    assignedDepartment: "City Power & Electrical Services",
    assignedOfficerId: "usr-officer-01",
    assignedOfficerName: "Officer Sarah Chen",
    assignedAt: "2026-08-19T14:00:00Z",
    resolvedAt: "2026-08-19T17:45:00Z",
    resolvedByOfficerId: "usr-officer-01",
    resolvedByOfficerName: "Officer Sarah Chen",
    initialImageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=600&auto=format&fit=crop&q=80",
    beforeImageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=600&auto=format&fit=crop&q=80",
    afterImageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
    resolutionNotes: "De-energized feed line at breaker substation. Removed bent steel mast, installed new LED Luminaire column #H-129, torqued foundation anchor bolts to 220Nm, and tested ground fault circuit (0.02 Ohm). All clear.",
    materialsUsed: ["Standard 8m Octagonal Steel Mast", "120W LED Cobra Luminaire", "Grounding Rod & Copper Strap"],
    verificationStatus: "pending",
    history: [
      {
        id: "hist-21",
        timestamp: "2026-08-19T13:20:00Z",
        action: "Reported",
        actorName: "Mei Lin",
        actorRole: "citizen",
        details: "Live camera capture with high severity rating.",
      },
      {
        id: "hist-22",
        timestamp: "2026-08-19T17:45:00Z",
        action: "Resolved by Officer",
        actorName: "Officer Sarah Chen",
        actorRole: "officer",
        details: "Uploaded After Photo and inspection sign-off. Awaiting citizen verification.",
      },
    ],
    createdAt: "2026-08-19T13:20:00Z",
    updatedAt: "2026-08-19T17:45:00Z",
  },
  {
    id: "ISS-2026-0808",
    userId: "usr-citizen-01",
    reporterName: "Aria Montgomery",
    title: "Unauthorized Industrial Hazardous Dumping Behind Waterfront Pier",
    category: "Sanitation & Waste",
    subcategory: "Illegal Hazardous Waste Disposal",
    description: "6 abandoned chemical barrels and loose asbestos construction debris blocking emergency fire lane access behind Warehouse #19.",
    latitude: 37.8012,
    longitude: -122.4019,
    address: "Pier 27 Waterfront Promenade, Embarcadero",
    landmark: "North of Cruise Terminal entrance",
    status: "verified",
    priorityScore: 78,
    severity: "High",
    reportCount: 2,
    upvotes: 14,
    assignedDepartment: "Municipal Solid Waste Management",
    assignedOfficerId: "usr-officer-01",
    assignedOfficerName: "Officer Sarah Chen",
    assignedAt: "2026-08-18T09:00:00Z",
    resolvedAt: "2026-08-18T16:30:00Z",
    resolvedByOfficerId: "usr-officer-01",
    resolvedByOfficerName: "Officer Sarah Chen",
    initialImageUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80",
    beforeImageUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80",
    afterImageUrl: "https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?w=600&auto=format&fit=crop&q=80",
    resolutionNotes: "Hazardous Materials squad dispatched with hazmat containment vehicle. Barrels safely logged, manifest secured, area power-washed and cleared.",
    verificationStatus: "verified_citizen",
    verifiedAt: "2026-08-18T18:10:00Z",
    verificationNotes: "Inspected in person on my evening walk. Completely cleared and safe! Thank you for the rapid turnaround.",
    history: [
      {
        id: "hist-31",
        timestamp: "2026-08-18T08:30:00Z",
        action: "Reported",
        actorName: "Aria Montgomery",
        actorRole: "citizen",
        details: "Reported with photo evidence.",
      },
      {
        id: "hist-32",
        timestamp: "2026-08-18T16:30:00Z",
        action: "Resolved",
        actorName: "Officer Sarah Chen",
        actorRole: "officer",
        details: "Uploaded After Photo and waste consignment tracking manifest.",
      },
      {
        id: "hist-33",
        timestamp: "2026-08-18T18:10:00Z",
        action: "Verified & Closed",
        actorName: "Aria Montgomery",
        actorRole: "citizen",
        details: "Citizen confirmed 100% resolution satisfaction.",
      },
    ],
    createdAt: "2026-08-18T08:30:00Z",
    updatedAt: "2026-08-18T18:10:00Z",
  },
  {
    id: "ISS-2026-0805",
    userId: "usr-citizen-02",
    reporterName: "Samuel Brooks",
    title: "Collapsed Pedestrian Sidewalk & Broken Curb Ramp",
    category: "Roads & Infrastructure",
    subcategory: "Curb Ramp / Sidewalk Fracture",
    description: "Wheelchair ramp curb has collapsed inward creating a 5-inch step barrier that traps mobility scooters and prams.",
    latitude: 37.7589,
    longitude: -122.4215,
    address: "2450 Mission St, Mission District",
    landmark: "In front of 24th St BART Plaza",
    status: "submitted",
    priorityScore: 72,
    severity: "Medium",
    reportCount: 1,
    upvotes: 9,
    assignedDepartment: "Department of Public Works",
    initialImageUrl: "https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      predictedCategory: "Roads & Infrastructure",
      subcategory: "ADA Sidewalk Barrier",
      confidence: 0.94,
      severity: "Medium",
      calculatedPriorityScore: 72,
      safetyRisks: ["ADA non-compliance", "Wheelchair tip hazard"],
      recommendedDepartment: "Department of Public Works",
      estimatedResolutionHours: 36,
      suggestedEquipment: ["Concrete Ready-Mix", "ADA Tactile Truncated Dome Mat"],
      actionChecklist: ["Demolish broken curb", "Form new 1:12 ADA ramp", "Set yellow tactile pavers"],
      summary: "ADA curb ramp fracture requiring concrete re-pouring and tactile tile insertion.",
    },
    history: [
      {
        id: "hist-41",
        timestamp: "2026-08-20T09:10:00Z",
        action: "Submitted",
        actorName: "Samuel Brooks",
        actorRole: "citizen",
        details: "New issue submitted via Citizen Portal.",
      },
    ],
    createdAt: "2026-08-20T09:10:00Z",
    updatedAt: "2026-08-20T09:10:00Z",
  },
  {
    id: "ISS-2026-0802",
    userId: "usr-citizen-03",
    reporterName: "Maya Lin",
    title: "Large Storm-Damaged Tree Branch Suspended Over Children's Playground",
    category: "Parks & Public Spaces",
    subcategory: "Hazardous Tree Limbs",
    description: "400kg eucalyptus branch snapped during high winds, currently caught on swingset cable. High risk of falling when children use swings.",
    latitude: 37.7694,
    longitude: -122.4862,
    address: "Golden Gate Park, Conservatory Dr",
    landmark: "Children's Playground zone near Carousel",
    status: "assigned",
    priorityScore: 86,
    severity: "High",
    reportCount: 4,
    upvotes: 21,
    assignedDepartment: "Parks & Urban Forestry",
    assignedOfficerId: "usr-officer-01",
    assignedOfficerName: "Officer Sarah Chen",
    assignedAt: "2026-08-20T08:15:00Z",
    deadlineAt: "2026-08-20T16:00:00Z",
    slaHours: 8,
    initialImageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      predictedCategory: "Parks & Public Spaces",
      subcategory: "Suspended Heavy Limb",
      confidence: 0.97,
      severity: "High",
      calculatedPriorityScore: 86,
      safetyRisks: ["Immediate blunt impact hazard for playground users", "Damage to recreational equipment"],
      recommendedDepartment: "Parks & Urban Forestry",
      estimatedResolutionHours: 8,
      suggestedEquipment: ["Arborist Rigging Lines", "Chainsaw 50cc", "Wood Chipper"],
      actionChecklist: ["Cordon off playground perimeter", "Rig limb with friction brake", "Section into manageable firewood"],
      summary: "Suspended heavy eucalyptus branch over active playground equipment.",
    },
    history: [
      {
        id: "hist-51",
        timestamp: "2026-08-20T07:45:00Z",
        action: "Reported",
        actorName: "Maya Lin",
        actorRole: "citizen",
        details: "Tagged with playground safety urgency.",
      },
      {
        id: "hist-52",
        timestamp: "2026-08-20T08:15:00Z",
        action: "Assigned",
        actorName: "Director Marcus Vance",
        actorRole: "admin",
        details: "Urban forestry team dispatched.",
      },
    ],
    createdAt: "2026-08-20T07:45:00Z",
    updatedAt: "2026-08-20T08:15:00Z",
  },
  {
    id: "ISS-2026-0799",
    userId: "usr-citizen-01",
    reporterName: "Lucas Sterling",
    title: "Commercial Signage Illegally Encroaching on Public Bus Shelter",
    category: "Public Safety & Encroachment",
    subcategory: "Illegal Commercial Encroachment",
    description: "Private advertising billboard frame bolted directly onto municipal bus shelter glass, blocking wheelchair boarding sightlines.",
    latitude: 37.7865,
    longitude: -122.4089,
    address: "850 Powell St, Nob Hill",
    landmark: "Powell Street Cable Car Turnaround",
    status: "in_progress",
    priorityScore: 64,
    severity: "Medium",
    reportCount: 2,
    upvotes: 11,
    assignedDepartment: "Public Safety & Traffic Enforcement",
    assignedOfficerId: "usr-officer-02",
    assignedOfficerName: "Officer Tariq Al-Mansoor",
    assignedAt: "2026-08-19T11:00:00Z",
    deadlineAt: "2026-08-21T18:00:00Z",
    slaHours: 48,
    initialImageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80",
    history: [
      {
        id: "hist-61",
        timestamp: "2026-08-19T10:00:00Z",
        action: "Reported",
        actorName: "Lucas Sterling",
        actorRole: "citizen",
        details: "Encroachment violation reported.",
      },
    ],
    createdAt: "2026-08-19T10:00:00Z",
    updatedAt: "2026-08-19T11:00:00Z",
  },
  {
    id: "ISS-2026-0792",
    userId: "usr-citizen-04",
    reporterName: "Carlos Delgado",
    title: "Overflowing Storm Drain Grate Clogged with Debris",
    category: "Water & Sewage",
    subcategory: "Blocked Storm Inlet",
    description: "Grate packed solid with leaves and plastic waste, causing 4 inches of standing water on the intersection crosswalk.",
    latitude: 37.7525,
    longitude: -122.4181,
    address: "3100 24th St, Calle 24 Latino Cultural District",
    landmark: "Near Brava Theater Center",
    status: "submitted",
    priorityScore: 70,
    severity: "Medium",
    reportCount: 2,
    upvotes: 12,
    assignedDepartment: "Water Supply & Sewerage Board",
    initialImageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=600&auto=format&fit=crop&q=80",
    history: [
      {
        id: "hist-71",
        timestamp: "2026-08-20T08:50:00Z",
        action: "Reported",
        actorName: "Carlos Delgado",
        actorRole: "citizen",
        details: "Reported with photos.",
      },
    ],
    createdAt: "2026-08-20T08:50:00Z",
    updatedAt: "2026-08-20T08:50:00Z",
  },
  {
    id: "ISS-2026-0785",
    userId: "usr-citizen-02",
    reporterName: "Priya Sharma",
    title: "Traffic Signal Stuck on Continuous Flashing Red at Major 4-Way Junction",
    category: "Roads & Infrastructure",
    subcategory: "Traffic Signal Failure",
    description: "Signal controller board crashed after electrical surge. Junction gridlocked with near-misses on cross traffic.",
    latitude: 37.7885,
    longitude: -122.4005,
    address: "1st St & Folsom St, SOMA Tech District",
    landmark: "Adjacent to Salesforce Transit Tower",
    status: "in_progress",
    priorityScore: 96,
    severity: "Critical",
    reportCount: 8,
    upvotes: 42,
    assignedDepartment: "Public Safety & Traffic Enforcement",
    assignedOfficerId: "usr-officer-01",
    assignedOfficerName: "Officer Sarah Chen",
    assignedAt: "2026-08-20T08:30:00Z",
    deadlineAt: "2026-08-20T11:30:00Z",
    slaHours: 3,
    initialImageUrl: "https://images.unsplash.com/photo-1508873696983-2df57046475a?w=600&auto=format&fit=crop&q=80",
    history: [
      {
        id: "hist-81",
        timestamp: "2026-08-20T08:15:00Z",
        action: "High Alert Triggered",
        actorName: "Priya Sharma",
        actorRole: "citizen",
        details: "Traffic light malfunction reported.",
      },
    ],
    createdAt: "2026-08-20T08:15:00Z",
    updatedAt: "2026-08-20T08:30:00Z",
  },
  {
    id: "ISS-2026-0780",
    userId: "usr-citizen-01",
    reporterName: "Jordan Reed",
    title: "Vandalized Public Park Bench with Exposed Nails",
    category: "Parks & Public Spaces",
    subcategory: "Damaged Public Furniture",
    description: "Slats broken off with 3-inch rusty nails protruding straight up where seniors sit.",
    latitude: 37.7602,
    longitude: -122.4278,
    address: "Dolores Park, 19th & Dolores St",
    landmark: "Near the central palm trees overlook",
    status: "resolved",
    priorityScore: 61,
    severity: "Medium",
    reportCount: 1,
    upvotes: 8,
    assignedDepartment: "Parks & Urban Forestry",
    assignedOfficerId: "usr-officer-02",
    assignedOfficerName: "Officer Tariq Al-Mansoor",
    assignedAt: "2026-08-19T09:00:00Z",
    resolvedAt: "2026-08-19T14:20:00Z",
    resolvedByOfficerId: "usr-officer-02",
    resolvedByOfficerName: "Officer Tariq Al-Mansoor",
    initialImageUrl: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&auto=format&fit=crop&q=80",
    beforeImageUrl: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&auto=format&fit=crop&q=80",
    afterImageUrl: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&auto=format&fit=crop&q=80",
    resolutionNotes: "Replaced 4 mahogany wood slats, recessed all stainless security bolts, and sanded smooth.",
    verificationStatus: "verified_citizen",
    verifiedAt: "2026-08-19T16:00:00Z",
    history: [
      {
        id: "hist-91",
        timestamp: "2026-08-19T08:00:00Z",
        action: "Reported",
        actorName: "Jordan Reed",
        actorRole: "citizen",
        details: "Park safety issue reported.",
      },
    ],
    createdAt: "2026-08-19T08:00:00Z",
    updatedAt: "2026-08-19T16:00:00Z",
  },
  {
    id: "ISS-2026-0775",
    userId: "usr-citizen-03",
    reporterName: "Zoe Henderson",
    title: "Broken Fire Hydrant Gushing Water onto Bus Lane",
    category: "Water & Sewage",
    subcategory: "Damaged Fire Hydrant",
    description: "Side cap sheered off by delivery truck hit-and-run.",
    latitude: 37.7789,
    longitude: -122.3995,
    address: "4th St & King St, Mission Bay",
    landmark: "Near Caltrain Terminal",
    status: "verified",
    priorityScore: 92,
    severity: "Critical",
    reportCount: 6,
    upvotes: 31,
    assignedDepartment: "Water Supply & Sewerage Board",
    assignedOfficerId: "usr-officer-02",
    assignedOfficerName: "Officer Tariq Al-Mansoor",
    resolvedAt: "2026-08-17T15:00:00Z",
    verifiedAt: "2026-08-17T17:30:00Z",
    verificationStatus: "verified_citizen",
    history: [
      {
        id: "hist-101",
        timestamp: "2026-08-17T12:00:00Z",
        action: "Reported & Closed",
        actorName: "Zoe Henderson",
        actorRole: "citizen",
        details: "Emergency repair confirmed.",
      },
    ],
    createdAt: "2026-08-17T12:00:00Z",
    updatedAt: "2026-08-17T17:30:00Z",
  },
  {
    id: "ISS-2026-0770",
    userId: "usr-citizen-02",
    reporterName: "Marcus Brody",
    title: "Illegal Electronic Waste Dump on Vacant Municipal Lot",
    category: "Sanitation & Waste",
    subcategory: "Hazardous E-Waste Dump",
    description: "Over 50 discarded CRT monitors, lithium batteries, and smashed circuit boards exposed to rain.",
    latitude: 37.7389,
    longitude: -122.3895,
    address: "150 Evans Ave, Bayview-Hunters Point",
    landmark: "Behind Municipal Fleet Yard 4",
    status: "in_progress",
    priorityScore: 76,
    severity: "High",
    reportCount: 3,
    upvotes: 16,
    assignedDepartment: "Municipal Solid Waste Management",
    assignedOfficerId: "usr-officer-01",
    assignedOfficerName: "Officer Sarah Chen",
    assignedAt: "2026-08-19T13:00:00Z",
    deadlineAt: "2026-08-21T18:00:00Z",
    slaHours: 48,
    initialImageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80",
    history: [
      {
        id: "hist-111",
        timestamp: "2026-08-19T11:30:00Z",
        action: "Reported",
        actorName: "Marcus Brody",
        actorRole: "citizen",
        details: "E-waste pile reported with GPS.",
      },
    ],
    createdAt: "2026-08-19T11:30:00Z",
    updatedAt: "2026-08-19T13:00:00Z",
  },
];

// Pre-seeded Civic Integrity / Whistleblower Vault Reports (Encrypted & SHA-256 Hashed)
export let INTEGRITY_REPORTS: IntegrityReport[] = [
  {
    id: "SEC-VAULT-90412",
    trackingCode: "WHISTLE-2026-90412-X",
    category: "Unauthorized Construction",
    title: "Nighttime Unpermitted 4th-Story Commercial Addition Without Safety Permits",
    description: "Contractor operating heavy cranes past midnight without city structural permits or seismic retrofitting certificates. Bribes allegedly offered to bypass stop-work notice.",
    departmentInvolved: "Department of Building Inspection & Zoning",
    suspectedPersonnel: "Site Supervisor Greg Miller & Unnamed Zone Inspector",
    evidenceFiles: [
      {
        id: "ev-01",
        name: "crane_night_construction_log.jpg",
        url: "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=600&auto=format&fit=crop&q=80",
        size: "3.4 MB",
        mimeType: "image/jpeg",
        sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      },
      {
        id: "ev-02",
        name: "forged_zoning_stamp_scan.pdf",
        url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80",
        size: "1.1 MB",
        mimeType: "application/pdf",
        sha256Hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      },
    ],
    sha256MasterHash: "7b4c919d3f11d61a86895e69e46a7be74a621f37e4c5b630e669ef0ecbe2a89c",
    latitude: 37.7792,
    longitude: -122.4185,
    address: "550 Larkin St, Civic Center District",
    capturedAt: "2026-08-19T23:45:00Z",
    submittedAt: "2026-08-20T01:10:00Z",
    status: "investigation_active",
    investigatorId: "usr-investigator-01",
    investigatorName: "Inspector Elena Rostova",
    investigatorNotes: "Subpoena issued for building blueprints and crane operating permits. Cross-referencing city inspector timestamp logs with tower GPS records.",
    accessLevel: "RESTRICTED_INVESTIGATOR_ONLY",
    auditTrail: [
      {
        id: "step-1",
        stepName: "Evidence Captured with Geo-Lock",
        timestamp: "2026-08-19T23:45:00Z",
        status: "completed",
        actor: "Whistleblower Client (Encrypted)",
        notes: "GPS coordinates locked and hardware timestamp signed.",
        hashVerification: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      },
      {
        id: "step-2",
        stepName: "Cryptographic SHA-256 Master Digest Generated",
        timestamp: "2026-08-20T01:10:00Z",
        status: "completed",
        actor: "CivicAI Integrity Engine",
        notes: "Immutable SHA-256 Hash: 7b4c919d3f11d61a86895e69e46a7be74a621f37e4c5b630e669ef0ecbe2a89c",
      },
      {
        id: "step-3",
        stepName: "Vault Submission & Whistleblower Shield Engaged",
        timestamp: "2026-08-20T01:11:00Z",
        status: "completed",
        actor: "Secure Ingestion Gateway",
        notes: "Metadata scrubbed. Zero IP or personal data leaked to public registries.",
      },
      {
        id: "step-4",
        stepName: "Lead Investigator Assigned",
        timestamp: "2026-08-20T07:30:00Z",
        status: "completed",
        actor: "Inspector Elena Rostova",
        notes: "Classified case file opened under Oversight Warrant #IA-2026-881.",
      },
      {
        id: "step-5",
        stepName: "Formal Site Inspection & Subpoena Enforcement",
        timestamp: "2026-08-20T09:00:00Z",
        status: "current",
        actor: "Integrity Field Taskforce",
        notes: "Onsite unannounced compliance audit underway.",
      },
      {
        id: "step-6",
        stepName: "Final Legal Action & Public Redacted Disclosure",
        timestamp: "Pending",
        status: "pending",
        actor: "City Attorney & Inspector General",
      },
    ],
  },
  {
    id: "SEC-VAULT-90408",
    trackingCode: "WHISTLE-2026-90408-A",
    category: "Suspected Bribery",
    title: "Municipal Waste Collection Route Favoritism & Cash Kickback Exchange",
    description: "Eyewitness audio-video of private commercial scrap hauler paying cash in envelopes to bypass municipal landfill weight scales and disposal fees.",
    departmentInvolved: "Municipal Solid Waste Management",
    suspectedPersonnel: "Scale Operator Shift Lead #4",
    evidenceFiles: [
      {
        id: "ev-11",
        name: "scale_weigh_in_timestamp.jpg",
        url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80",
        size: "2.8 MB",
        mimeType: "image/jpeg",
        sha256Hash: "3f79bb7b435b05321651daefd374cdc681dc06faa65e374e38337b88ca14539f",
      },
    ],
    sha256MasterHash: "c5d2e098a5e8f498687b1c4e70e9a5c89e4726b1c8f492b4507b9ef83b429188",
    latitude: 37.7421,
    longitude: -122.3912,
    address: "Tunnel Ave & Recycle Rd, Transfer Station Gate 3",
    capturedAt: "2026-08-18T16:20:00Z",
    submittedAt: "2026-08-18T18:00:00Z",
    status: "action_taken",
    investigatorId: "usr-investigator-01",
    investigatorName: "Inspector Elena Rostova",
    investigatorNotes: "Operator suspended pending disciplinary tribunal. Scale automated logging firmware updated to eliminate manual weight override bypass.",
    accessLevel: "RESTRICTED_INVESTIGATOR_ONLY",
    auditTrail: [
      {
        id: "step-21",
        stepName: "Evidence Captured with Geo-Lock",
        timestamp: "2026-08-18T16:20:00Z",
        status: "completed",
        actor: "Whistleblower Client (Encrypted)",
      },
      {
        id: "step-22",
        stepName: "Cryptographic SHA-256 Master Digest Generated",
        timestamp: "2026-08-18T18:00:00Z",
        status: "completed",
        actor: "CivicAI Integrity Engine",
      },
      {
        id: "step-23",
        stepName: "Investigation Completed & Corrective Sanctions Enacted",
        timestamp: "2026-08-19T15:00:00Z",
        status: "completed",
        actor: "Inspector Elena Rostova",
      },
    ],
  },
];

// In-Memory Database Controller Helper Functions
export const db = {
  // Issues
  getIssues: (filters?: {
    status?: string;
    category?: string;
    department?: string;
    severity?: string;
    search?: string;
    userId?: string;
  }) => {
    let result = [...ISSUES];

    if (filters?.status && filters.status !== "all") {
      result = result.filter((i) => i.status === filters.status);
    }
    if (filters?.category && filters.category !== "all") {
      result = result.filter((i) => i.category === filters.category);
    }
    if (filters?.department && filters.department !== "all") {
      result = result.filter((i) => i.assignedDepartment === filters.department);
    }
    if (filters?.severity && filters.severity !== "all") {
      result = result.filter((i) => i.severity === filters.severity);
    }
    if (filters?.userId) {
      result = result.filter((i) => i.userId === filters.userId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.address.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }

    // Sort by priority score descending, then created date
    return result.sort((a, b) => b.priorityScore - a.priorityScore || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getIssueById: (id: string) => {
    return ISSUES.find((i) => i.id === id);
  },

  createIssue: (newIssue: Partial<CivicIssue>): CivicIssue => {
    const id = `ISS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const severity = newIssue.severity || "Medium";
    const priorityScore = newIssue.priorityScore || computePriorityScore(severity, 20, 15, 1, 0);

    const issue: CivicIssue = {
      id,
      userId: newIssue.userId || "usr-citizen-01",
      reporterName: newIssue.reporterName || "Civic Citizen",
      isAnonymous: Boolean(newIssue.isAnonymous),
      reporterContact: newIssue.reporterContact,
      title: newIssue.title || "Reported Civic Defect",
      category: newIssue.category || "Roads & Infrastructure",
      subcategory: newIssue.subcategory || "General Public Defect",
      description: newIssue.description || "",
      latitude: newIssue.latitude || 37.7749,
      longitude: newIssue.longitude || -122.4194,
      address: newIssue.address || "Downtown Municipal Corridor",
      landmark: newIssue.landmark,
      status: "submitted",
      priorityScore,
      severity,
      reportCount: 1,
      upvotes: 1,
      upvotedUserIds: [newIssue.userId || "usr-citizen-01"],
      initialImageUrl: newIssue.initialImageUrl,
      beforeImageUrl: newIssue.beforeImageUrl || newIssue.initialImageUrl,
      assignedDepartment: newIssue.assignedDepartment || "Department of Public Works",
      aiAnalysis: newIssue.aiAnalysis,
      history: [
        {
          id: `hist-${Date.now()}`,
          timestamp: now,
          action: "Issue Reported",
          actorName: newIssue.reporterName || "Civic Citizen",
          actorRole: "citizen",
          details: "Created via Citizen Report Portal.",
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    ISSUES.unshift(issue);
    return issue;
  },

  updateIssue: (id: string, updates: Partial<CivicIssue>): CivicIssue | null => {
    const idx = ISSUES.findIndex((i) => i.id === id);
    if (idx === -1) return null;

    const existing = ISSUES[idx];
    const updated: CivicIssue = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    ISSUES[idx] = updated;
    return updated;
  },

  upvoteIssue: (id: string, userId: string): CivicIssue | null => {
    const issue = ISSUES.find((i) => i.id === id);
    if (!issue) return null;

    issue.upvotedUserIds = issue.upvotedUserIds || [];
    if (!issue.upvotedUserIds.includes(userId)) {
      issue.upvotedUserIds.push(userId);
      issue.upvotes += 1;
      issue.reportCount += 1;
      // Recompute priority score with duplicate boost
      issue.priorityScore = Math.min(100, issue.priorityScore + 4);
      issue.history.push({
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "Citizen Upvote / Duplicate Confirmation",
        actorName: "Citizen Neighbor",
        actorRole: "citizen",
        details: `Confirmed active presence of issue (+1 Upvote). Report count increased to ${issue.reportCount}.`,
      });
      issue.updatedAt = new Date().toISOString();
    }
    return issue;
  },

  // Calculate distance between two lat/long points in meters (Haversine formula)
  calculateDistanceMeters: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  },

  checkDuplicates: (latitude: number, longitude: number, category?: string, radiusMeters: number = 80) => {
    const potentialDuplicates = ISSUES.map((issue) => {
      const distanceMeters = db.calculateDistanceMeters(latitude, longitude, issue.latitude, issue.longitude);
      const isNearby = distanceMeters <= radiusMeters;
      const isSameCategory = !category || issue.category.toLowerCase() === category.toLowerCase();
      return {
        issue,
        distanceMeters,
        isNearby,
        isSameCategory,
        confidence: isNearby && isSameCategory ? 0.95 : isNearby ? 0.75 : 0.2,
      };
    }).filter((match) => match.isNearby);

    return potentialDuplicates.sort((a, b) => a.distanceMeters - b.distanceMeters);
  },

  // Civic Integrity Vault
  getIntegrityReports: () => {
    return [...INTEGRITY_REPORTS].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  },

  createIntegrityReport: (reportData: Partial<IntegrityReport>): IntegrityReport => {
    const id = `SEC-VAULT-${Math.floor(10000 + Math.random() * 90000)}`;
    const trackingCode = `WHISTLE-2026-${Math.floor(10000 + Math.random() * 90000)}-X`;
    const now = new Date().toISOString();

    const rawDigestPayload = `${reportData.title || ""}-${reportData.category || ""}-${now}-${reportData.latitude || 0}-${reportData.longitude || 0}`;
    const sha256MasterHash = generateSHA256Hash(rawDigestPayload);

    const newReport: IntegrityReport = {
      id,
      trackingCode,
      category: reportData.category || "Suspected Bribery",
      title: reportData.title || "Confidential Whistleblower Report",
      description: reportData.description || "",
      departmentInvolved: reportData.departmentInvolved || "Municipal Administration",
      suspectedPersonnel: reportData.suspectedPersonnel,
      evidenceFiles: reportData.evidenceFiles || [
        {
          id: `ev-${Date.now()}`,
          name: "encrypted_evidence_capture.jpg",
          url: "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=600&auto=format&fit=crop&q=80",
          size: "2.4 MB",
          mimeType: "image/jpeg",
          sha256Hash: generateSHA256Hash(`file-${now}`),
        },
      ],
      sha256MasterHash,
      latitude: reportData.latitude || 37.7749,
      longitude: reportData.longitude || -122.4194,
      address: reportData.address || "Confidential Secure Geo-Point",
      capturedAt: reportData.capturedAt || now,
      submittedAt: now,
      status: "under_review",
      accessLevel: "RESTRICTED_INVESTIGATOR_ONLY",
      auditTrail: [
        {
          id: `step-${Date.now()}-1`,
          stepName: "Evidence Captured with Geo-Lock",
          timestamp: reportData.capturedAt || now,
          status: "completed",
          actor: "Whistleblower Client (Encrypted)",
          notes: "GPS coordinates locked & hardware timestamp signed.",
        },
        {
          id: `step-${Date.now()}-2`,
          stepName: "Cryptographic SHA-256 Master Digest Generated",
          timestamp: now,
          status: "completed",
          actor: "CivicAI Integrity Engine",
          notes: `Immutable Hash: ${sha256MasterHash}`,
          hashVerification: sha256MasterHash,
        },
        {
          id: `step-${Date.now()}-3`,
          stepName: "Vault Ingestion & Shield Engaged",
          timestamp: now,
          status: "completed",
          actor: "Secure Ingestion Gateway",
          notes: "Metadata scrubbed. Whistleblower privacy protected.",
        },
        {
          id: `step-${Date.now()}-4`,
          stepName: "Investigator Review",
          timestamp: "Pending",
          status: "current",
          actor: "Office of Public Integrity",
        },
      ],
    };

    INTEGRITY_REPORTS.unshift(newReport);
    return newReport;
  },

  updateIntegrityReport: (id: string, updates: Partial<IntegrityReport>): IntegrityReport | null => {
    const idx = INTEGRITY_REPORTS.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const existing = INTEGRITY_REPORTS[idx];
    const updated = { ...existing, ...updates };
    INTEGRITY_REPORTS[idx] = updated;
    return updated;
  },

  // Analytics Overview
  getAnalytics: (): AnalyticsOverview => {
    const totalIssues = ISSUES.length;
    const pendingIssues = ISSUES.filter((i) => i.status === "submitted" || i.status === "assigned").length;
    const inProgressIssues = ISSUES.filter((i) => i.status === "in_progress").length;
    const resolvedIssues = ISSUES.filter((i) => i.status === "resolved").length;
    const verifiedIssues = ISSUES.filter((i) => i.status === "verified").length;
    const criticalAlertsCount = ISSUES.filter((i) => i.severity === "Critical" && i.status !== "verified" && i.status !== "resolved").length;

    // Category distribution
    const catMap = new Map<string, number>();
    ISSUES.forEach((i) => {
      catMap.set(i.category, (catMap.get(i.category) || 0) + 1);
    });
    const categoryDistribution = Array.from(catMap.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / totalIssues) * 100),
    }));

    // Status distribution
    const statusMap = new Map<IssueStatus, number>();
    ISSUES.forEach((i) => {
      statusMap.set(i.status, (statusMap.get(i.status) || 0) + 1);
    });
    const statusDistribution: { status: IssueStatus; count: number }[] = [
      { status: "submitted", count: statusMap.get("submitted") || 0 },
      { status: "assigned", count: statusMap.get("assigned") || 0 },
      { status: "in_progress", count: statusMap.get("in_progress") || 0 },
      { status: "resolved", count: statusMap.get("resolved") || 0 },
      { status: "verified", count: statusMap.get("verified") || 0 },
    ];

    // Recurring problem spots
    const recurringProblemSpots = [
      {
        spotName: "Market St & 5th Transit Hub",
        latitude: 37.7842,
        longitude: -122.4075,
        incidentCount: 14,
        primaryCategory: "Roads & Infrastructure",
        urgencyLevel: "Critical" as const,
      },
      {
        spotName: "Haight-Ashbury Junction Corridor",
        latitude: 37.7698,
        longitude: -122.4467,
        incidentCount: 9,
        primaryCategory: "Electrical & Lighting",
        urgencyLevel: "High" as const,
      },
      {
        spotName: "Pier 27 Waterfront Promenade",
        latitude: 37.8012,
        longitude: -122.4019,
        incidentCount: 8,
        primaryCategory: "Sanitation & Waste",
        urgencyLevel: "High" as const,
      },
      {
        spotName: "Mission 24th St Commercial Plaza",
        latitude: 37.7525,
        longitude: -122.4181,
        incidentCount: 6,
        primaryCategory: "Water & Sewage",
        urgencyLevel: "Medium" as const,
      },
    ];

    return {
      totalIssues,
      pendingIssues,
      inProgressIssues,
      resolvedIssues,
      verifiedIssues,
      criticalAlertsCount,
      integrityReportsCount: INTEGRITY_REPORTS.length,
      averageResolutionHours: 14.8,
      overallSatisfaction: 4.82,
      duplicateMergedCount: 23,
      departmentStats: DEPARTMENTS,
      categoryDistribution,
      statusDistribution,
      resolutionVelocityTrend: [
        { month: "Apr", reported: 48, resolved: 44 },
        { month: "May", reported: 62, resolved: 58 },
        { month: "Jun", reported: 75, resolved: 71 },
        { month: "Jul", reported: 89, resolved: 84 },
        { month: "Aug", reported: 114, resolved: 106 },
      ],
      recurringProblemSpots,
    };
  },
};
