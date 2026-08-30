import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { CivicIssue } from "../types";
import {
  ALL_CATEGORIES,
  COMPLAINT_CATEGORY_CONFIG,
  SEVERITY_CONFIG,
  type ComplaintCategory,
  type ComplaintRecord,
} from "../lib/complaintData";

// ─── Filter bar config ────────────────────────────────────────────────────────

type FilterKey = "All" | ComplaintCategory;

const FILTER_OPTIONS: { key: FilterKey; label: string; emoji: string }[] = [
  { key: "All", label: "All", emoji: "🗺️" },
  ...ALL_CATEGORIES.map((cat) => ({
    key: cat as FilterKey,
    label: COMPLAINT_CATEGORY_CONFIG[cat].label,
    emoji: COMPLAINT_CATEGORY_CONFIG[cat].emoji,
  })),
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ComplaintMapProps {
  /** Standard civic issues from the global store */
  civicIssues?: CivicIssue[];
  onSelectCivicIssue?: (issue: CivicIssue) => void;
  /** Local complaint records (Food, Traffic, Parking) */
  complaintRecords?: ComplaintRecord[];
  center?: [number, number];
  zoom?: number;
  /** When set, renders a draggable pin and calls back on change */
  interactivePinLocation?: [number, number] | null;
  onPinChange?: (lat: number, lng: number) => void;
  isPinDraggable?: boolean;
  className?: string;
  /** Show the filter bar above the map */
  showFilterBar?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDivIcon(color: string, svgPath: string, label: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:36px;height:36px;border-radius:50%;
          background:${color}22;border:2.5px solid ${color};
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 12px ${color}44;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            ${svgPath}
          </svg>
        </div>
        <span style="
          margin-top:3px;font-size:9px;font-weight:700;color:${color};
          background:rgba(0,0,0,0.7);padding:1px 5px;border-radius:4px;
          white-space:nowrap;max-width:80px;overflow:hidden;text-overflow:ellipsis;
        ">${label}</span>
      </div>`,
    iconSize: [36, 54],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}

const SVG_PATHS: Record<ComplaintCategory, string> = {
  "Food & Health Safety":
    '<path d="M9 4h6M9 20h6M12 4v16M5 9c0-2.2 3.1-4 7-4s7 1.8 7 4"/><path d="M5 15c0 2.2 3.1 4 7 4s7-1.8 7-4"/>',
  "Traffic Jam":
    '<rect width="18" height="11" x="3" y="8" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>',
  "Illegal Parking":
    '<rect width="18" height="11" x="3" y="8" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><path d="M10 13h2a1 1 0 0 1 0 2h-2v-2zm0 0v-2h1.5a1.5 1.5 0 0 1 0 2"/>',
};

function makeCivicIcon(severity: string) {
  const colorMap: Record<string, string> = {
    Critical: "#f43f5e",
    High: "#f97316",
    Medium: "#f59e0b",
    Low: "#22c55e",
  };
  const c = colorMap[severity] ?? "#6366f1";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${c}22;border:2px solid ${c};
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px ${c}66;font-size:11px;font-weight:800;color:${c};
    ">${severity === "Critical" ? "!" : "•"}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function statusBadge(status: ComplaintRecord["status"]) {
  const cfg: Record<string, string> = {
    Reported: "background:#1e293b;color:#94a3b8;border:1px solid #334155",
    "Under Review": "background:#1c1917;color:#fb923c;border:1px solid #78350f",
    Escalated: "background:#1c1917;color:#f87171;border:1px solid #7f1d1d",
    Resolved: "background:#052e16;color:#4ade80;border:1px solid #14532d",
  };
  return `<span style="font-size:9px;font-weight:700;padding:1px 7px;border-radius:9999px;${cfg[status] ?? ""}">${status}</span>`;
}

function complaintPopupHtml(r: ComplaintRecord): string {
  const cfg = COMPLAINT_CATEGORY_CONFIG[r.category];
  const sev = SEVERITY_CONFIG[r.severity];
  const date = new Date(r.incidentAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `
    <div style="width:220px;font-family:system-ui,sans-serif;">
      ${r.imageUrl ? `<img src="${r.imageUrl}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />` : ""}
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
        <span style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:9999px;background:${cfg.markerColor}22;color:${cfg.markerColor};border:1px solid ${cfg.markerColor}44;">${cfg.emoji} ${r.category}</span>
        <span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:9999px;background:${sev.bg.replace("bg-","").replace("/10","")};color:${sev.color.replace("text-","")};opacity:.85;">${r.severity}</span>
        ${statusBadge(r.status)}
      </div>
      <div style="font-size:10px;font-weight:700;color:#f1f5f9;margin-bottom:2px;">${r.subType}</div>
      ${r.establishmentName ? `<div style="font-size:10px;color:#94a3b8;margin-bottom:4px;">📍 ${r.establishmentName}</div>` : ""}
      ${r.description ? `<div style="font-size:10px;color:#64748b;margin-bottom:6px;line-height:1.4;">${r.description.substring(0, 100)}${r.description.length > 100 ? "…" : ""}</div>` : ""}
      <div style="font-size:9px;color:#475569;border-top:1px solid #1e293b;padding-top:5px;margin-top:4px;">🕐 ${date}</div>
    </div>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ComplaintMap({
  civicIssues = [],
  onSelectCivicIssue,
  complaintRecords = [],
  center = [37.7749, -122.4194],
  zoom = 13,
  interactivePinLocation,
  onPinChange,
  isPinDraggable = false,
  className = "w-full h-full min-h-[380px] rounded-2xl",
  showFilterBar = true,
}: ComplaintMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const civicLayerRef = useRef<L.LayerGroup | null>(null);
  const complaintLayerRef = useRef<L.LayerGroup | null>(null);
  const userPinRef = useRef<L.Marker | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterKey>("All");

  // ── Init map ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    civicLayerRef.current = L.layerGroup().addTo(map);
    complaintLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    if (onPinChange) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        onPinChange(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Recenter on prop change ─────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom, { animate: true });
    }
  }, [center[0], center[1], zoom]);

  // ── Draggable user pin ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (interactivePinLocation) {
      const pinIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:40px;height:40px;border-radius:50%;
          background:#6366f122;border:2.5px solid #6366f1;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 14px #6366f166;animation:bounce 1s infinite;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="#6366f1" stroke-width="2.5">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 38],
      });

      if (userPinRef.current) {
        userPinRef.current.setLatLng(interactivePinLocation);
      } else {
        const marker = L.marker(interactivePinLocation, {
          icon: pinIcon,
          draggable: isPinDraggable,
        }).addTo(map);
        if (isPinDraggable && onPinChange) {
          marker.on("dragend", (e) => {
            const p = e.target.getLatLng();
            onPinChange(p.lat, p.lng);
          });
        }
        userPinRef.current = marker;
      }
    } else if (userPinRef.current) {
      userPinRef.current.remove();
      userPinRef.current = null;
    }
  }, [interactivePinLocation?.[0], interactivePinLocation?.[1], isPinDraggable]);

  // ── Civic issues markers ────────────────────────────────────────────────
  useEffect(() => {
    if (!civicLayerRef.current) return;
    const layer = civicLayerRef.current;
    layer.clearLayers();

    civicIssues.forEach((issue) => {
      const icon = makeCivicIcon(issue.severity);
      const marker = L.marker([issue.latitude, issue.longitude], { icon });
      marker.bindPopup(`
        <div style="width:200px;font-family:system-ui,sans-serif;">
          ${issue.initialImageUrl ? `<img src="${issue.initialImageUrl}" style="width:100%;height:70px;object-fit:cover;border-radius:8px;margin-bottom:6px;" />` : ""}
          <div style="font-size:10px;font-weight:800;color:#f1f5f9;margin-bottom:2px;">${issue.title}</div>
          <div style="font-size:9px;color:#94a3b8;margin-bottom:4px;">${issue.category} • ${issue.status.replace("_", " ")}</div>
          <div style="font-size:9px;color:#64748b;">📍 ${issue.address}</div>
        </div>`);
      if (onSelectCivicIssue) {
        marker.on("click", () => onSelectCivicIssue(issue));
      }
      layer.addLayer(marker);
    });
  }, [civicIssues]);

  // ── Complaint records markers ───────────────────────────────────────────
  useEffect(() => {
    if (!complaintLayerRef.current) return;
    const layer = complaintLayerRef.current;
    layer.clearLayers();

    const visible = complaintRecords.filter(
      (r) => activeFilter === "All" || r.category === activeFilter
    );

    visible.forEach((r) => {
      const cfg = COMPLAINT_CATEGORY_CONFIG[r.category];
      const icon = makeDivIcon(cfg.markerColor, SVG_PATHS[r.category], r.subType);
      const marker = L.marker([r.latitude, r.longitude], { icon });
      marker.bindPopup(complaintPopupHtml(r));
      layer.addLayer(marker);
    });
  }, [complaintRecords, activeFilter]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-2xl ${className}`}>
      {/* Filter Bar */}
      {showFilterBar && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-1.5 rounded-xl border border-white/10 shadow-xl">
          {FILTER_OPTIONS.map((f) => {
            const active = activeFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setActiveFilter(f.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-150 whitespace-nowrap ${
                  active
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/50 hover:text-white/80 hover:bg-white/10"
                }`}
              >
                <span>{f.emoji}</span>
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Map canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
