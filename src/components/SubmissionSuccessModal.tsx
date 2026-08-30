import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface SubmissionSuccessModalProps {
  trackingId: string;
  category: string;
  locationName: string;
  onTrackComplaint: () => void;
  onReportAnother: () => void;
}

export default function SubmissionSuccessModal({
  trackingId,
  category,
  locationName,
  onTrackComplaint,
  onReportAnother,
}: SubmissionSuccessModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface border border-border-subtle rounded-3xl p-8 w-full max-w-md shadow-2xl flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">✓ Your complaint has been successfully reported!</h3>
          <p className="text-foreground/60 text-sm">
            Category: <span className="text-foreground font-medium">{category}</span>
          </p>
          <p className="text-foreground/60 text-sm">
            Location: <span className="text-foreground font-medium">{locationName}</span>
          </p>
        </div>

        <div className="px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-mono text-emerald-500 text-sm font-bold tracking-widest w-full text-center">
          Tracking ID: #{trackingId}
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
