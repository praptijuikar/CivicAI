import { useState, useRef, useCallback, useEffect } from "react";
import {
  Utensils,
  Car,
  ParkingCircle,
  MapPin,
  LocateFixed,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  ImageUp,
  Navigation,
  ChevronDown,
  Building2,
  Calendar,
} from "lucide-react";
import EXIF from "exif-js";
import {
  ALL_CATEGORIES,
  COMPLAINT_CATEGORY_CONFIG,
  SEVERITY_LEVELS,
  SEVERITY_CONFIG,
  type ComplaintCategory,
  type ComplaintSubType,
  type SeverityLevel,
  type ComplaintRecord,
} from "../lib/complaintData";
import ComplaintMap from "./ComplaintMap";

// ─── Re-export payload type ───────────────────────────────────────────────────
export type { ComplaintRecord };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dmsToDecimal(dms: number[], ref: string): number {
  const [d, m, s] = dms;
  let dd = d + m / 60 + s / 3600;
  if (ref === "S" || ref === "W") dd *= -1;
  return dd;
}

function extractExifGPS(file: File): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = (res: any) => {
      if (resolved) return;
      resolved = true;
      resolve(res);
    };

    setTimeout(() => safeResolve(null), 500);

    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          EXIF.getData(img as any, function (this: any) {
            const lat = EXIF.getTag(this, "GPSLatitude");
            const latRef = EXIF.getTag(this, "GPSLatitudeRef");
            const lng = EXIF.getTag(this, "GPSLongitude");
            const lngRef = EXIF.getTag(this, "GPSLongitudeRef");
            URL.revokeObjectURL(url);
            if (lat && latRef && lng && lngRef) {
              safeResolve({ lat: dmsToDecimal(lat, latRef), lng: dmsToDecimal(lng, lngRef) });
            } else {
              safeResolve(null);
            }
          });
        } catch {
          URL.revokeObjectURL(url);
          safeResolve(null);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); safeResolve(null); };
      img.src = url;
    } catch {
      safeResolve(null);
    }
  });
}

// ─── Category icon map ────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<ComplaintCategory, React.ReactNode> = {
  "Food & Health Safety": <Utensils className="w-4 h-4" />,
  "Traffic Jam":          <Car className="w-4 h-4" />,
  "Illegal Parking":      <ParkingCircle className="w-4 h-4" />,
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface TrafficReportFormProps {
  onClose: () => void;
  /** Called when a complaint is successfully submitted */
  onComplaintSubmitted?: (record: ComplaintRecord) => void;
  initialCategory?: "Food & Health Safety" | "Traffic Jam" | "Illegal Parking";
}

// local-only store so the map in the modal reflects already-submitted complaints
const SESSION_RECORDS: ComplaintRecord[] = [];

export default function TrafficReportForm({
  onClose,
  onComplaintSubmitted,
  initialCategory = "Traffic Jam",
}: TrafficReportFormProps) {
  // ── Category & sub-type ─────────────────────────────────────────────────
  const [category, setCategory] = useState<"Food & Health Safety" | "Traffic Jam" | "Illegal Parking">(initialCategory);
  const cfg = COMPLAINT_CATEGORY_CONFIG[category];
  const [subType, setSubType] = useState<ComplaintSubType>(cfg.subTypes[0]);

  // When category changes, reset subType to first of the new list
  useEffect(() => {
    setSubType(COMPLAINT_CATEGORY_CONFIG[category].subTypes[0]);
  }, [category]);

  // ── Other fields ────────────────────────────────────────────────────────
  const [establishmentName, setEstablishmentName] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<SeverityLevel>("Medium");
  const [incidentAt, setIncidentAt] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });

  // ── Location ────────────────────────────────────────────────────────────
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  // ── Image ───────────────────────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [exifNote, setExifNote] = useState<string | null>(null);

  // ── Submission ──────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [validationError, setValidationError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pinLocation: [number, number] | null =
    latitude !== null && longitude !== null ? [latitude, longitude] : null;
  const mapCenter: [number, number] =
    latitude !== null && longitude !== null ? [latitude, longitude] : [19.0760, 72.8777];

  useEffect(() => {
    handleGetLocation();
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handlePinChange = useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    setValidationError("");
    setExifNote(null);
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationLabel(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setExifNote(null);
        setValidationError("");
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setExifNote(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);

    const gps = await extractExifGPS(file);
    if (gps) {
      setLatitude(gps.lat);
      setLongitude(gps.lng);
      setLocationLabel(`${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`);
      setExifNote("📡 Location auto-filled from photo EXIF GPS data.");
      setValidationError("");
    } else {
      setExifNote("⚠️ No GPS data found in this photo. Please set location manually.");
    }
    e.target.value = "";
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageBase64(null);
    setExifNote(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    setSubmitError("");

    if (latitude === null || longitude === null) {
      setValidationError("Location is required. Click on the map, use GPS, or upload a geotagged photo.");
      return;
    }

    setIsSubmitting(true);
    const refId = `CIV-${Math.floor(100000 + Math.random() * 900000)}`;

    const record: ComplaintRecord = {
      id: refId,
      category,
      subType,
      establishmentName,
      description,
      severity,
      latitude,
      longitude,
      incidentAt: new Date(incidentAt).toISOString(),
      reportedAt: new Date().toISOString(),
      imageUrl: imageBase64 ?? undefined,
      imageFileName: imageFile?.name,
      status: "Reported",
    };

    try {
      await new Promise<void>((_, reject) => setTimeout(() => reject(new Error("API Mock Failed")), 1100));
    } catch {
      // Ignored: mock fallback
    } finally {
      setIsSubmitting(false);
      SESSION_RECORDS.push(record);
      
      try {
        const stored = JSON.parse(localStorage.getItem("civic_complaints") || "[]");
        stored.push(record);
        localStorage.setItem("civic_complaints", JSON.stringify(stored));
      } catch (e) {}

      onComplaintSubmitted?.(record);
      setSubmitSuccess(refId);
    }
  };

  useEffect(() => {
    if (!submitSuccess) return;
    const t = setTimeout(onClose, 5500);
    return () => clearTimeout(t);
  }, [submitSuccess, onClose]);

  // ── Success Screen ────────────────────────────────────────────────────────
  if (submitSuccess) {
    const currentCfg = COMPLAINT_CATEGORY_CONFIG[category];
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center gap-5 px-6">
        <div className={`w-20 h-20 rounded-full ${currentCfg.markerBg} border ${currentCfg.markerBorder} flex items-center justify-center`}>
          <CheckCircle2 className={`w-10 h-10 ${currentCfg.markerText}`} />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground">Complaint Submitted!</h3>
          <p className="text-sm text-foreground/60 mt-1">
            Your <strong className={currentCfg.markerText}>{category}</strong> complaint has been filed with the relevant authority.
          </p>
        </div>
        <div className={`px-5 py-3 rounded-xl ${currentCfg.markerBg} border ${currentCfg.markerBorder} font-mono ${currentCfg.markerText} text-sm font-bold tracking-widest`}>
          ✓ Complaint submitted successfully! Tracking ID: #{submitSuccess}
        </div>
        <p className="text-xs text-foreground/40">This window closes in 5 seconds…</p>
        <button onClick={onClose} className="text-xs text-foreground/60 hover:text-foreground underline transition">
          Close now
        </button>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── 1. Category ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
          Complaint Category <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ALL_CATEGORIES.map((cat) => {
            const catCfg = COMPLAINT_CATEGORY_CONFIG[cat];
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center text-[11px] font-semibold transition-all duration-150 ${
                  active
                    ? `${catCfg.markerBg} ${catCfg.markerBorder} ${catCfg.markerText} shadow-md`
                    : "bg-background border-border-subtle text-foreground/50 hover:border-foreground/20 hover:text-foreground/80"
                }`}
              >
                <span className="text-lg">{catCfg.emoji}</span>
                <span className={active ? catCfg.markerText : "text-foreground/40"}>
                  {CATEGORY_ICONS[cat]}
                </span>
                <span className="leading-tight">{catCfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Sub-type ─────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
          Sub-Type <span className="text-rose-400">*</span>
        </label>
        <div className="relative">
          <select
            value={subType}
            onChange={(e) => setSubType(e.target.value as ComplaintSubType)}
            className={`w-full appearance-none bg-background border ${cfg.markerBorder} rounded-xl px-4 py-2.5 pr-10 text-xs font-semibold ${cfg.markerText} focus:outline-none transition-colors cursor-pointer`}
          >
            {cfg.subTypes.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 pointer-events-none" />
        </div>
      </div>

      {/* ── 3. Establishment / Location Name ─────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          Establishment / Location Name
          <span className="text-foreground/30 normal-case font-medium">(optional)</span>
        </label>
        <input
          type="text"
          value={establishmentName}
          onChange={(e) => setEstablishmentName(e.target.value)}
          placeholder={
            category === "Food & Health Safety"
              ? "e.g. City Hospital Ward 4, Dragon Palace Restaurant, Primary Health Center…"
              : category === "Traffic Jam"
              ? "e.g. Market St & 5th Ave Intersection…"
              : "e.g. City Hall Parking Zone B…"
          }
          className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#00F2FE]/60 transition-colors placeholder:text-foreground/30"
        />
      </div>

      {/* ── 4. Severity ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
          Severity Level <span className="text-rose-400">*</span>
        </label>
        <div className="flex gap-2">
          {SEVERITY_LEVELS.map((sev) => {
            const sc = SEVERITY_CONFIG[sev];
            const active = severity === sev;
            return (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverity(sev)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[11px] font-bold transition-all ${
                  active
                    ? `${sc.bg} ${sc.border} ${sc.color} shadow-sm`
                    : "bg-background border-border-subtle text-foreground/40 hover:text-foreground/70 hover:border-foreground/20"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${active ? sc.dot : "bg-foreground/20"}`} />
                {sev}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. Incident Date & Time ──────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Incident Date &amp; Time <span className="text-rose-400">*</span>
        </label>
        <input
          type="datetime-local"
          value={incidentAt}
          max={new Date().toISOString().slice(0, 16)}
          onChange={(e) => setIncidentAt(e.target.value)}
          className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#00F2FE]/60 transition-colors"
        />
      </div>

      {/* ── 6. Description ──────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
          Description
          <span className="text-foreground/30 normal-case font-medium ml-1">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={cfg.descriptionPlaceholder}
          className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-foreground resize-none focus:outline-none focus:border-[#00F2FE]/60 transition-colors placeholder:text-foreground/30"
        />
      </div>

      {/* ── 7. Evidence Photo ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
          Evidence / Photo Receipt
          <span className="text-foreground/30 normal-case font-medium ml-1">(GPS auto-extracted)</span>
        </label>

        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden border border-border-subtle h-32 group">
            <img src={imagePreview} alt="Evidence" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button type="button" onClick={removeImage}
                className="p-2 rounded-full bg-rose-500/80 text-white hover:bg-rose-500 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-2 left-2 text-[10px] font-mono text-white/80 bg-black/60 px-2 py-0.5 rounded-lg backdrop-blur">
              {imageFile?.name}
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 py-5 rounded-xl border-2 border-dashed border-border-subtle hover:border-[#00F2FE]/40 bg-background cursor-pointer transition-colors group"
          >
            <ImageUp className="w-6 h-6 text-foreground/20 group-hover:text-[#00F2FE]/60 transition-colors" />
            <p className="text-xs text-foreground/50 group-hover:text-foreground/70 transition-colors">
              Click to upload JPEG, PNG, or HEIC
            </p>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/heic"
          className="hidden" onChange={handleFileChange} />

        {exifNote && (
          <p className={`text-[11px] font-medium px-3 py-2 rounded-lg border ${
            exifNote.startsWith("📡")
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
          }`}>
            {exifNote}
          </p>
        )}
      </div>

      {/* ── 8. Location ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            Location Pin <span className="text-rose-400">*</span>
          </label>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-[#00F2FE] bg-[#00F2FE]/10 border border-[#00F2FE]/20 hover:bg-[#00F2FE]/20 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
          >
            {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <LocateFixed className="w-3 h-3" />}
            {isLocating ? "Locating…" : "Use My GPS"}
          </button>
        </div>

        {/* Coordinate pill */}
        <div className="flex items-center gap-2 bg-background border border-border-subtle rounded-xl px-3 py-2">
          <Navigation className="w-4 h-4 text-foreground/30 shrink-0" />
          <span className={`text-xs font-mono flex-1 truncate ${locationLabel ? "text-[#00F2FE]" : "text-foreground/30"}`}>
            {locationLabel || "Click the map or use GPS to set location"}
          </span>
          {pinLocation && (
            <button type="button"
              onClick={() => { setLatitude(null); setLongitude(null); setLocationLabel(""); setExifNote(null); }}
              className="text-foreground/30 hover:text-rose-400 transition">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Map */}
        <div className="h-52 rounded-xl overflow-hidden border border-border-subtle shadow-inner">
          <ComplaintMap
            complaintRecords={SESSION_RECORDS}
            center={mapCenter}
            zoom={pinLocation ? 16 : 13}
            interactivePinLocation={pinLocation}
            onPinChange={handlePinChange}
            isPinDraggable={true}
            showFilterBar={false}
            className="w-full h-full rounded-xl"
          />
        </div>
        <p className="text-[10px] text-foreground/40 flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          Click on the map to place a pin. Drag to refine.
        </p>
      </div>

      {/* ── Errors ──────────────────────────────────────────────────────── */}
      {validationError && (
        <p className="text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-lg">
          {validationError}
        </p>
      )}
      {submitError && (
        <p className="text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-lg">
          {submitError}
        </p>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-border-subtle text-xs font-semibold text-foreground/60 hover:text-foreground hover:border-foreground/20 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r ${
            category === "Food & Health Safety"
              ? "from-emerald-500 to-green-600 shadow-emerald-500/20"
              : category === "Traffic Jam"
              ? "from-red-500 to-rose-600 shadow-red-500/20"
              : "from-orange-500 to-amber-500 shadow-orange-500/20"
          }`}
        >
          {isSubmitting ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…</>
          ) : (
            <><Upload className="w-3.5 h-3.5" /> Submit Complaint</>
          )}
        </button>
      </div>
    </form>
  );
}
