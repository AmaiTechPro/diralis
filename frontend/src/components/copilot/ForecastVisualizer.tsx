import React from "react";
import { TrendingUp, ShieldCheck } from "lucide-react";

export interface ForecastPoint {
  period: string;
  projectedValue: number;
  lowerBound80?: number;
  upperBound80?: number;
  lowerBound95?: number;
  upperBound95?: number;
}

export interface ForecastVisualizerProps {
  metricName: string;
  modelType: string;
  detectedPeriodicity?: number;
  historicalPoints?: { period: string; value: number }[];
  points: ForecastPoint[];
  goodnessOfFit?: {
    mae: number;
    rmse: number;
  };
}

export const ForecastVisualizer: React.FC<ForecastVisualizerProps> = ({
  metricName,
  modelType,
  detectedPeriodicity,
  historicalPoints = [],
  points = [],
  goodnessOfFit,
}) => {
  const allValues: number[] = [
    ...historicalPoints.map((p) => p.value),
    ...points.map((p) => p.projectedValue),
    ...points.map((p) => p.upperBound95 ?? p.projectedValue),
    ...points.map((p) => p.lowerBound95 ?? p.projectedValue),
  ];

  const minVal = Math.min(...allValues) * 0.95;
  const maxVal = Math.max(...allValues) * 1.05;
  const range = maxVal - minVal || 1;

  const width = 500;
  const height = 180;
  const padding = 30;

  const totalPointsCount = historicalPoints.length + points.length;
  const getX = (index: number) =>
    padding + (index / Math.max(1, totalPointsCount - 1)) * (width - 2 * padding);
  const getY = (val: number) =>
    height - padding - ((val - minVal) / range) * (height - 2 * padding);

  // Build Historical SVG path
  const histPath = historicalPoints
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx)} ${getY(p.value)}`)
    .join(" ");

  // Build Forecast SVG path
  const offset = historicalPoints.length - 1;
  const forecastPath = [
    historicalPoints.length > 0
      ? `M ${getX(offset)} ${getY(historicalPoints[offset].value)}`
      : `M ${getX(0)} ${getY(points[0]?.projectedValue ?? 0)}`,
    ...points.map(
      (p, idx) => `L ${getX(historicalPoints.length + idx)} ${getY(p.projectedValue)}`
    ),
  ].join(" ");

  // Build 95% Confidence Band Polygon
  const band95Path =
    points.length > 0
      ? [
          `M ${getX(offset)} ${getY(historicalPoints[offset]?.value ?? points[0].projectedValue)}`,
          ...points.map((p, idx) => `L ${getX(historicalPoints.length + idx)} ${getY(p.upperBound95 ?? p.projectedValue)}`),
          ...points.slice().reverse().map((p, idx) => `L ${getX(historicalPoints.length + points.length - 1 - idx)} ${getY(p.lowerBound95 ?? p.projectedValue)}`),
          "Z",
        ].join(" ")
      : "";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-cyan-400" />
          <span className="text-xs font-bold text-slate-200">
            {metricName} — {modelType.replace(/_/g, " ")}
          </span>
        </div>
        {detectedPeriodicity && (
          <span className="rounded bg-cyan-950/80 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-800/50">
            Periodicity: L={detectedPeriodicity}
          </span>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
          {/* Shaded 95% Confidence Band */}
          {band95Path && <path d={band95Path} fill="rgba(6, 182, 212, 0.12)" />}

          {/* Historical Path */}
          {histPath && (
            <path
              d={histPath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="2,2"
            />
          )}

          {/* Projected Path */}
          {forecastPath && (
            <path d={forecastPath} fill="none" stroke="#22d3ee" strokeWidth="2.5" />
          )}

          {/* Forecast Points */}
          {points.map((p, idx) => {
            const cx = getX(historicalPoints.length + idx);
            const cy = getY(p.projectedValue);
            return (
              <g key={idx}>
                <circle cx={cx} cy={cy} r="4" fill="#06b6d4" />
                <text
                  x={cx}
                  y={cy - 8}
                  fill="#e2e8f0"
                  fontSize="10"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {p.projectedValue.toLocaleString()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {goodnessOfFit && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Deterministic Fit Model</span>
          </span>
          <span>MAE: {goodnessOfFit.mae.toFixed(2)} | RMSE: {goodnessOfFit.rmse.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};


