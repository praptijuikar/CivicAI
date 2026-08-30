import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { CivicIssue } from "../types.ts";

interface InteractiveMapProps {
  issues: CivicIssue[];
  selectedIssue?: CivicIssue | null;
  onSelectIssue?: (issue: CivicIssue) => void;
  center?: [number, number];
  zoom?: number;
  interactivePinLocation?: [number, number] | null;
  onPinChange?: (lat: number, lng: number) => void;
  isPinDraggable?: boolean;
  className?: string;
}

export default function InteractiveMap({
  issues,
  selectedIssue,
  onSelectIssue,
  center = [37.7749, -122.4194],
  zoom = 13,
  interactivePinLocation,
  onPinChange,
  isPinDraggable = false,
  className = "w-full h-full min-h-[380px] rounded-2xl",
}: InteractiveMapProps) {
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userPinMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
    });

    // Free, open-source OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Handle map clicks if pin mode is enabled
    if (onPinChange) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        onPinChange(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center?.[0], center?.[1], zoom]);

  // Render Interactive Pin for Report Creator
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (interactivePinLocation) {
      const pinIcon = L.divIcon({
        className: "custom-user-pin",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-slate-900 font-bold shadow-xl border-2 border-white animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span class="absolute -bottom-6 bg-white text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded shadow border border-indigo-500 whitespace-nowrap">
              Report Location
            </span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 38],
      });

      if (userPinMarkerRef.current) {
        userPinMarkerRef.current.setLatLng(interactivePinLocation);
      } else {
        const marker = L.marker(interactivePinLocation, {
          icon: pinIcon,
          draggable: isPinDraggable,
        }).addTo(map);

        if (isPinDraggable && onPinChange) {
          marker.on("dragend", (e) => {
            const pos = e.target.getLatLng();
            onPinChange(pos.lat, pos.lng);
          });
        }

        userPinMarkerRef.current = marker;
      }
    } else if (userPinMarkerRef.current) {
      userPinMarkerRef.current.remove();
      userPinMarkerRef.current = null;
    }
  }, [interactivePinLocation?.[0], interactivePinLocation?.[1], isPinDraggable]);

  // Render Civic Issues Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    issues.forEach((issue) => {
      // Color logic based on severity
      let colorClass = "bg-amber-500";
      let pulseRing = "";
      if (issue.severity === "Critical") {
        colorClass = "bg-rose-500 text-slate-900";
        pulseRing = '<div class="absolute -inset-1 bg-rose-500/40 rounded-full animate-ping"></div>';
      } else if (issue.severity === "High") {
        colorClass = "bg-orange-500 text-slate-900";
      } else if (issue.severity === "Medium") {
        colorClass = "bg-amber-500 text-slate-950";
      } else {
        colorClass = "bg-emerald-500 text-slate-950";
      }

      const isSelected = selectedIssue?.id === issue.id;

      const markerHtml = `
        <div class="relative group cursor-pointer">
          ${pulseRing}
          <div class="w-8 h-8 ${colorClass} rounded-full flex items-center justify-center font-bold text-xs shadow-lg border-2 ${
        isSelected ? "border-cyan-400 ring-4 ring-cyan-400/40 scale-125" : "border-white/90"
      } transition-all duration-200 hover:scale-110">
            ${issue.severity === "Critical" ? "!" : ""}
          </div>
          <div class="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[11px] font-medium px-2 py-0.5 rounded shadow border border-slate-300 whitespace-nowrap z-50 pointer-events-none">
            ${issue.category} • ${issue.status.replace("_", " ")}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-issue-marker",
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([issue.latitude, issue.longitude], {
        icon: customIcon,
      });

      // Interactive Popup
      const popupHtml = `
        <div class="w-64 p-1 text-slate-700">
          ${
            issue.initialImageUrl
              ? `<img src="${issue.initialImageUrl}" class="w-full h-24 object-cover rounded-lg mb-2 border border-slate-300" alt="${issue.title}" />`
              : ""
          }
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${
              issue.severity === "Critical"
                ? "bg-rose-950 text-rose-300 border border-rose-800"
                : issue.severity === "High"
                ? "bg-orange-950 text-orange-300 border border-orange-800"
                : "bg-blue-950 text-blue-300 border border-blue-800"
            }">${issue.severity}</span>
            <span class="text-[10px] capitalize text-slate-500 font-mono">${issue.status.replace("_", " ")}</span>
          </div>
          <h4 class="text-xs font-semibold text-slate-100 line-clamp-1 mb-1">${issue.title}</h4>
          <p class="text-[11px] text-slate-500 line-clamp-2 mb-2">${issue.description}</p>
          <div class="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-200 pt-1.5">
            <span class="truncate max-w-[140px]">📍 ${issue.address}</span>
            <span class="font-bold text-cyan-400 font-mono">${issue.id}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        if (onSelectIssue) {
          onSelectIssue(issue);
        }
      });

      marker.addTo(layer);
    });
  }, [issues, selectedIssue?.id]);

  return (
    <div className={`relative overflow-hidden border border-slate-200 shadow-2xl ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
