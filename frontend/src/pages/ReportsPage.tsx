import { useEffect, useState } from "react";

import PageHeader from "../components/ui/PageHeader";
import ReportCard from "../components/reports/ReportCard";

import { getReport } from "../services/reportService";
import { downloadReport } from "../services/reportDownloadService";


export default function ReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [generating, setGenerating] = useState(false);


  useEffect(() => {
    getReport().then(setReport);
  }, []);


  const handleGenerateReport = async () => {
    try {
      setGenerating(true);

      await downloadReport();

    } catch (error) {
      console.error("Report generation failed:", error);

    } finally {
      setGenerating(false);
    }
  };


  if (!report) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading Reports...
      </div>
    );
  }


  return (
    <div className="space-y-8">

      <div className="flex items-center justify-between">

        <PageHeader
          title="📄 Reports"
          subtitle="Generate professional AI-powered business reports."
        />


        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="
            rounded-lg
            bg-blue-600
            px-5
            py-3
            text-white
            shadow-md
            transition
            hover:bg-blue-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {generating
            ? "Generating..."
            : "📄 Generate Report"}
        </button>

      </div>


      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        <ReportCard
          title="Executive Report"
          description={report.summary}
          icon="📊"
          section="executive"
        />


        <ReportCard
          title="Business Health"
          description={`Business Health: ${report.businessHealth}%`}
          icon="💚"
          section="health"
        />


        <ReportCard
          title="AI Score"
          description={`Overall AI Score: ${report.aiScore}`}
          icon="🤖"
          section="ai-score"
        />


        <ReportCard
          title="Insights"
          description={`${report.insights} AI insights generated`}
          icon="💡"
          section="insights"
        />


        <ReportCard
          title="Warnings"
          description={`${report.warnings} warnings detected`}
          icon="⚠️"
          section="warnings"
        />


        <ReportCard
          title="Recommendations"
          description={`${report.recommendations.length} recommendations available`}
          icon="🚀"
          section="recommendations"
        />

      </div>

    </div>
  );
}
