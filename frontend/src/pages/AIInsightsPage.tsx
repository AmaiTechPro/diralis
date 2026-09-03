import { useEffect, useState } from "react";
import {
  Lightbulb,
  Activity,
  AlertTriangle,
  Brain,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";

import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import PageHeader from "../components/ui/PageHeader";
import InsightItem from "../components/ui/InsightItem";
import { getOverallInsights } from "../services/overallInsightsService";
import ExecutiveSummary from "../components/ui/ExecutiveSummary";
import AIPriorityCard from "../components/ui/AIPriorityCard";
import AIConfidenceCard from "../components/ui/AIConfidenceCard";
import RiskOpportunityPanel from "../components/ui/RiskOpportunityPanel";

interface PriorityRec {
  title: string;
  description: string;
  level: "High" | "Medium" | "Low";
}

export default function AIInsightsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getOverallInsights()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load insights.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading AI Insights...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-400">
        <AlertTriangle className="mx-auto mb-3" size={32} />
        <p className="font-medium">{error || "Unable to retrieve analytical insights."}</p>
      </div>
    );
  }

  // Grounded empty state when tenant has analyzed 0 datasets
  if (data.totalDatasets === 0 || (!data.recommendations?.length && !data.risks?.length)) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="🤖 AI Insights"
          subtitle="AI-powered business intelligence across all analyzed datasets."
        />
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
          <Layers className="mx-auto mb-4 text-cyan-400" size={40} />
          <h3 className="text-xl font-semibold text-slate-200">No Dataset Insights Yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Upload or integrate your transaction, inventory, or operational datasets to generate grounded telemetry and recommendations.
          </p>
          <Link
            to="/datasets"
            className="mt-6 inline-flex items-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
          >
            Go to Datasets
          </Link>
        </div>
      </div>
    );
  }

  // Deterministically derive priority levels from dynamic recommendations
  const dynamicPriorities: PriorityRec[] = (data.recommendations || []).map(
    (rec: string, index: number): PriorityRec => {
      const isUrgent =
        rec.toLowerCase().includes("risk") ||
        rec.toLowerCase().includes("anomaly") ||
        rec.toLowerCase().includes("variance");
      return {
        title: `Strategic Action ${index + 1}`,
        description: rec,
        level: isUrgent ? "High" : index === 1 ? "Medium" : "Low",
      };
    }
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="🤖 AI Insights"
        subtitle="AI-powered business intelligence across all analyzed datasets."
      />

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          icon={<Activity size={32} />}
          label="Business Health"
          value={data.businessHealth ?? 0}
          suffix="%"
          color="text-cyan-400"
        />

        <StatCard
          icon={<Lightbulb size={32} />}
          label="Insights"
          value={data.totalInsights ?? data.insights?.length ?? 0}
          color="text-yellow-400"
        />

        <StatCard
          icon={<AlertTriangle size={32} />}
          label="Warnings"
          value={data.warnings ?? data.risks?.length ?? 0}
          color="text-orange-400"
        />

        <StatCard
          icon={<Brain size={32} />}
          label="AI Score"
          value={data.aiScore ?? data.confidenceScore ?? 0}
          color="text-violet-400"
        />
      </div>

      <AIConfidenceCard confidence={data.confidenceScore ?? data.aiScore ?? 0} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RiskOpportunityPanel
          title="Business Risks"
          icon="⚠️"
          items={data.risks || []}
        />

        <RiskOpportunityPanel
          title="Business Opportunities"
          icon="🚀"
          items={data.opportunities || []}
        />
      </div>

      {data.summary && <ExecutiveSummary summary={data.summary} />}

      {dynamicPriorities.length > 0 && (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-white">
            🎯 Priority Recommendations
          </h2>

          {dynamicPriorities.slice(0, 3).map((item, idx) => (
            <AIPriorityCard
              key={idx}
              title={item.title}
              description={item.description}
              level={item.level}
            />
          ))}
        </div>
      )}

      {data.recommendations && data.recommendations.length > 0 && (
        <Card>
          <h2 className="mb-6 text-2xl font-semibold text-white">
            Latest AI Recommendations
          </h2>

          <div className="space-y-4">
            {data.recommendations.map((item: string, index: number) => (
              <InsightItem key={index} text={item} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}


