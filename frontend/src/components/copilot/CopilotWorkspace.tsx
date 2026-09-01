import React, { useState, useEffect } from "react";
import { copilotService } from "../../services/copilotService";
import type { CopilotInsightItem } from "../../services/copilotService";
import { InsightCard } from "./InsightCard";
import { ScenarioSimulator } from "./ScenarioSimulator";
import { Activity, Layers } from "lucide-react";

interface CopilotWorkspaceProps {
  datasetId?: string;
  onSendPrompt?: (prompt: string) => void;
}

export const CopilotWorkspace: React.FC<CopilotWorkspaceProps> = ({ datasetId, onSendPrompt }) => {
  const [insights, setInsights] = useState<CopilotInsightItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    copilotService
      .getFeed(datasetId)
      .then((data) => setInsights(data.insights))
      .catch(() => setInsights([]))
      .finally(() => setLoading(false));
  }, [datasetId]);

  const handleDismiss = async (id: string) => {
    await copilotService.dismissInsight(id);
    setInsights((prev) => prev.filter((item) => item.id !== id));
  };

  const handleInvestigate = (insight: CopilotInsightItem) => {
    if (onSendPrompt) {
      onSendPrompt(
        `Investigate the ${insight.severity} anomaly detected in ${insight.metricName}: ${insight.narrative}`
      );
    }
  };

  const handleApplySimulation = (deltaPct: number) => {
    if (onSendPrompt) {
      onSendPrompt(
        `Evaluate the business impact if our primary operating cost variable shifts by ${deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`}.`
      );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-5 bg-slate-950/40">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Proactive Copilot Feed</h3>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
          {insights.length} Active
        </span>
      </div>

      <ScenarioSimulator
        baseMetricName="Monthly Revenue"
        baselineValue={25000}
        variableName="Customer Acquisition Cost"
        unit="$"
        onApplySimulation={handleApplySimulation}
      />

      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <Layers size={14} />
          <span>Detected Anomalies & Insights</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Scanning statistical profile...</div>
        ) : insights.length === 0 ? (
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-6 text-center text-xs text-slate-500">
            No active anomalies detected in this dataset.
          </div>
        ) : (
          insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={handleDismiss}
              onInvestigate={handleInvestigate}
            />
          ))
        )}
      </div>
    </div>
  );
};

