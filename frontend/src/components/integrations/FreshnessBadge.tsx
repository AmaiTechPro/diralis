import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Clock, Ban } from "lucide-react";
import type { FreshnessClassification } from "../../services/integrationService";

interface FreshnessBadgeProps {
  freshness: FreshnessClassification;
  className?: string;
}

export const FreshnessBadge: React.FC<FreshnessBadgeProps> = ({ freshness, className = "" }) => {
  switch (freshness) {
    case "FRESH":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}
        >
          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
          <span>Fresh</span>
        </span>
      );
    case "SYNCING":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 ${className}`}
        >
          <RefreshCw size={13} className="text-cyan-400 animate-spin shrink-0" />
          <span>Syncing...</span>
        </span>
      );
    case "STALE":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 ${className}`}
        >
          <Clock size={13} className="text-amber-400 shrink-0" />
          <span>Stale</span>
        </span>
      );
    case "NEEDS_REAUTH":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 ${className}`}
        >
          <AlertTriangle size={13} className="text-rose-400 shrink-0" />
          <span>Re-auth Required</span>
        </span>
      );
    case "ERROR":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 ${className}`}
        >
          <AlertCircle size={13} className="text-red-400 shrink-0" />
          <span>Sync Failed</span>
        </span>
      );
    case "DISABLED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 ${className}`}
        >
          <Ban size={13} className="text-slate-400 shrink-0" />
          <span>Disabled</span>
        </span>
      );
    case "NEVER_SYNCED":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 ${className}`}
        >
          <Clock size={13} className="text-slate-400 shrink-0" />
          <span>Never Synced</span>
        </span>
      );
  }
};

