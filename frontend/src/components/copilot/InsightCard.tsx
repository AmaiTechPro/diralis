import React from "react";
import type { CopilotInsightItem } from "../../services/copilotService";
import { AlertTriangle, Sparkles, Check, Info } from "lucide-react";

interface InsightCardProps {
  insight: CopilotInsightItem;
  onDismiss: (id: string) => void;
  onInvestigate?: (insight: CopilotInsightItem) => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onDismiss, onInvestigate }) => {
  const isCritical = insight.severity === "CRITICAL";
  const isHigh = insight.severity === "HIGH" || insight.severity === "WARNING";

  const getSeverityBadge = () => {
    if (isCritical) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20">
          <AlertTriangle size={11} /> Critical Anomaly
        </span>
      );
    }
    if (isHigh) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
          <AlertTriangle size={11} /> High Deviation
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/20">
        <Info size={11} /> Analytical Note
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-700 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {getSeverityBadge()}
          <span className="text-xs text-slate-400">Deterministic Engine Fact</span>
        </div>
        <button
          onClick={() => onDismiss(insight.id)}
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition"
          title="Acknowledge & Dismiss"
        >
          <Check size={14} />
        </button>
      </div>

      <h4 className="mt-2.5 text-sm font-semibold text-white">{insight.title}</h4>
      <p className="mt-1 text-xs text-slate-300 leading-relaxed">{insight.narrative}</p>

      {insight.evidenceJson && insight.evidenceJson.length > 0 && (
        <div className="mt-3 rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Calculated Evidence</div>
          <div className="mt-1 text-xs text-cyan-300/90 font-mono">{insight.evidenceJson[0]}</div>
        </div>
      )}

      {onInvestigate && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onInvestigate(insight)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
          >
            <Sparkles size={12} /> Investigate with Copilot &rarr;
          </button>
        </div>
      )}
    </div>
  );
};

