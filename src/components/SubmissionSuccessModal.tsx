import React from 'react';
import { CheckCircle2, Shield, Utensils } from 'lucide-react';

interface SubmissionSuccessModalProps {
  trackingId: string;
  category: string;
  locationName: string;
  onTrackComplaint: () => void;
  onReportAnother: () => void;
  departmentInvolved?: string;
}

export default function SubmissionSuccessModal({
  trackingId,
  category,
  locationName,
  onTrackComplaint,
  onReportAnother,
  departmentInvolved,
}: SubmissionSuccessModalProps) {
  let mainCategory = "Department & Service Issues";
  let Icon = CheckCircle2;
  let iconColor = "text-emerald-500";
  let iconBg = "bg-emerald-500/10";
  let trackingBg = "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
  
  if (trackingId.startsWith("INT-") || departmentInvolved) {
    mainCategory = "Integrity & Whistleblowing";
    Icon = Shield;
    iconColor = "text-purple-500";
    iconBg = "bg-purple-500/10";
    trackingBg = "bg-purple-500/10 border-purple-500/20 text-purple-500";
  } else if (trackingId.startsWith("FHD-") || category === "Food & Health Safety") {
    mainCategory = "Food & Health Standards";
    Icon = Utensils;
    iconColor = "text-amber-500";
    iconBg = "bg-amber-500/10";
    trackingBg = "bg-amber-500/10 border-amber-500/20 text-amber-500";
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface border border-border-subtle rounded-3xl p-8 w-full max-w-md shadow-2xl flex flex-col items-center text-center space-y-6">
        <div className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center animate-bounce`}>
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
        
        <div className="space-y-2 w-full text-center">
          <h3 className="text-xl font-bold text-foreground">✓ Your complaint has been successfully reported!</h3>
          
          <div className="text-left bg-background p-4 rounded-xl border border-border-subtle mt-4 w-full">
            {mainCategory === "Integrity & Whistleblowing" ? (
              <>
                <p className="text-foreground/60 text-sm">
                  Category: <span className="text-foreground font-medium">Integrity & Whistleblowing</span>
                </p>
                <p className="text-foreground/60 text-sm mt-1">
                  Department/Entity: <span className="text-foreground font-medium">{departmentInvolved || locationName}</span>
                </p>
                <p className="text-purple-400 text-xs mt-2 font-medium">
                  * Note: Handled with strict whistleblower confidentiality.
                </p>
              </>
            ) : mainCategory === "Food & Health Standards" ? (
              <>
                <p className="text-foreground/60 text-sm">
                  Category: <span className="text-foreground font-medium">Food & Health Standards</span>
                </p>
                <p className="text-foreground/60 text-sm mt-1">
                  Establishment/Location: <span className="text-foreground font-medium">{locationName}</span>
                </p>
              </>
            ) : (
              <>
                <p className="text-foreground/60 text-sm">
                  Category: <span className="text-foreground font-medium">{category}</span>
                </p>
                <p className="text-foreground/60 text-sm mt-1">
                  Location: <span className="text-foreground font-medium">{locationName}</span>
                </p>
              </>
            )}
          </div>
        </div>

        <div className={`px-5 py-3 rounded-xl border ${trackingBg} font-mono text-sm font-bold tracking-widest w-full text-center`}>
          Tracking ID: #{trackingId.replace(/^#/, '')}
        </div>

        <p className="text-sm font-medium text-foreground text-center">
          A real-time status update has been sent to your registered email address (citizen@civicai.local).
        </p>

        <div className="flex flex-col w-full gap-3 pt-4">
          <button
            onClick={onTrackComplaint}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors"
          >
            Track Complaint
          </button>
          <button
            onClick={onReportAnother}
            className="w-full py-3 bg-surface hover:bg-white/5 text-foreground border border-border-subtle rounded-xl font-bold transition-colors"
          >
            Report Another Issue
          </button>
        </div>
      </div>
    </div>
  );
}
