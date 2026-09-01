import React, { useState } from "react";
import { ChevronDown, ChevronUp, Database } from "lucide-react";
import { ForecastVisualizer } from "./ForecastVisualizer";
import { DriverSensitivityChart } from "./DriverSensitivityChart";

export interface EvidenceContainerProps {
  evidence: any[];
}

export const EvidenceContainer: React.FC<EvidenceContainerProps> = ({ evidence }) => {
  const [expanded, setExpanded] = useState(false);

  if (!evidence || evidence.length === 0) return null;

  const forecastEvidence = evidence.find((e) => e.tool === "generate_seasonal_forecast");
  const driverEvidence = evidence.find((e) => e.tool === "analyze_multivariable_drivers");
  const blendEvidence = evidence.find((e) => e.tool === "blend_datasets");

  return (
    <div className="mt-3 rounded-xl border border-slate-800/90 bg-slate-950/60 p-3 space-y-3">
      {/* Interactive Visualizations */}
      {forecastEvidence && (
        <ForecastVisualizer
          metricName={forecastEvidence.result.metricName}
          modelType={forecastEvidence.result.modelType}
          detectedPeriodicity={forecastEvidence.result.detectedPeriodicity}
          historicalPoints={forecastEvidence.result.historicalPoints}
          points={forecastEvidence.result.points}
          goodnessOfFit={forecastEvidence.result.goodnessOfFit}
        />
      )}

      {driverEvidence && (
        <DriverSensitivityChart
          targetMetric={driverEvidence.result.targetMetric}
          rSquared={driverEvidence.result.rSquared}
          adjustedRSquared={driverEvidence.result.adjustedRSquared}
          drivers={driverEvidence.result.drivers}
          warnings={driverEvidence.result.warnings}
        />
      )}

      {blendEvidence && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={15} className="text-cyan-400" />
            <span>
              Blended Relations: <strong>{blendEvidence.result.leftDatasetId}</strong> +{" "}
              <strong>{blendEvidence.result.rightDatasetId}</strong>
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {blendEvidence.result.blendedRows?.length ?? 0} Rows Joined
          </span>
        </div>
      )}

      {/* Raw Deterministic JSON Drawer */}
      <div className="border-t border-slate-800/80 pt-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition"
        >
          <span>Deterministic Calculation Audit ({evidence.length} Tool Executions)</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <pre className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300 overflow-x-auto max-h-48">
            {JSON.stringify(evidence, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};


