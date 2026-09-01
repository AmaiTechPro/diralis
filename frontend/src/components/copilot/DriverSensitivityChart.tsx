import React from "react";
import { SlidersHorizontal, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface DriverItem {
  featureName: string;
  rawCoefficient: number;
  standardizedBeta: number;
  varianceContributionPercent: number;
  vif: number;
  direction: "POSITIVE" | "NEGATIVE";
  significance: "DOMINANT" | "MODERATE" | "MARGINAL";
}

export interface DriverSensitivityChartProps {
  targetMetric: string;
  rSquared: number;
  adjustedRSquared: number;
  drivers: DriverItem[];
  warnings?: string[];
}

export const DriverSensitivityChart: React.FC<DriverSensitivityChartProps> = ({
  targetMetric,
  rSquared,
  adjustedRSquared,
  drivers = [],
  warnings = [],
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-purple-400" />
          <span className="text-xs font-bold text-slate-200">
            Key Drivers of {targetMetric} (OLS Regression)
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          R²: {(rSquared * 100).toFixed(1)}% | Adj R²: {(adjustedRSquared * 100).toFixed(1)}%
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-[11px] text-amber-300 flex items-center gap-2">
          <AlertTriangle size={14} className="flex-shrink-0 text-amber-400" />
          <span>{warnings[0]}</span>
        </div>
      )}

      <div className="space-y-2.5">
        {drivers.map((d, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                {d.direction === "POSITIVE" ? (
                  <span className="text-emerald-400 font-bold">+</span>
                ) : (
                  <span className="text-rose-400 font-bold">−</span>
                )}
                {d.featureName}
              </span>
              <span className="text-[11px] text-slate-400">
                β*: {d.standardizedBeta.toFixed(2)} ({d.varianceContributionPercent}%)
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  d.direction === "POSITIVE" ? "bg-emerald-500" : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, d.varianceContributionPercent))}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span className="uppercase tracking-wider font-semibold">{d.significance} DRIVER</span>
              <span>VIF: {d.vif.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span>Deterministic OLS Solver</span>
        </span>
        <span>{drivers.length} Evaluated Predictors</span>
      </div>
    </div>
  );
};


