import { useEffect, useState } from "react";
import {
  Lightbulb,
  Activity,
  AlertTriangle,
  Brain,
} from "lucide-react";

import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import PageHeader from "../components/ui/PageHeader";

import InsightItem from "../components/ui/InsightItem";

import { getOverallInsights } from "../services/overallInsightsService";

import ExecutiveSummary from "../components/ui/ExecutiveSummary";

import AIPriorityCard from "../components/ui/AIPriorityCard";

import AIConfidenceCard from "../components/ui/AIConfidenceCard";

import RiskOpportunityPanel from "../components/ui/RiskOpportunityPanel";


export default function AIInsightsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getOverallInsights().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading AI Insights...
      </div>
    );
  }

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
          value={data.businessHealth}
          suffix="%"
          color="text-cyan-400"
        />

        <StatCard
          icon={<Lightbulb size={32} />}
          label="Insights"
          value={data.totalInsights}
          color="text-yellow-400"
        />

        <StatCard
          icon={<AlertTriangle size={32} />}
          label="Warnings"
          value={data.warnings}
          color="text-orange-400"
        />

        <StatCard
          icon={<Brain size={32} />}
          label="AI Score"
          value={data.aiScore}
          color="text-violet-400"
        />

      </div>

    <AIConfidenceCard
       confidence={data.confidenceScore}
       /> 

       <div className="grid gap-6 lg:grid-cols-2">

  <RiskOpportunityPanel
    title="Business Risks"
    icon="⚠️"
    items={data.risks}
  />

   <RiskOpportunityPanel
    title="Business Opportunities"
    icon="🚀"
    items={data.opportunities}
     />

       </div> 


      <ExecutiveSummary
          summary={data.summary}
         />
  
         <div className="space-y-5">

  <h2 className="text-2xl font-bold text-white">
    🎯 Priority Recommendations
  </h2>

  <AIPriorityCard
    title="Improve Data Quality"
    description="Resolve missing values and inconsistent records before building predictive models."
    level="High"
  />

  <AIPriorityCard
    title="Monitor Business KPIs"
    description="Track your most important KPIs weekly to identify performance trends."
    level="Medium"
  />

  <AIPriorityCard
    title="Enable Forecasting"
    description="Datasets containing historical dates should be used for forecasting future performance."
    level="Low"
  />

</div>

      <Card>

        <h2 className="mb-6 text-2xl font-semibold text-white">
          Latest AI Recommendations
        </h2>

        <div className="space-y-4">

  {data.recommendations.map(
    (item: string, index: number) => (
      <InsightItem
        key={index}
        text={item}
      />
    )
  )}

</div>

      </Card>

    </div>
  );
}

