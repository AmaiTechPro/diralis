import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/ui/PageHeader";
import ReportCard from "../components/reports/ReportCard";

import { getReport } from "../services/reportService";
import { downloadReport } from "../services/reportDownloadService";

export default function ReportsPage() {

  const navigate = useNavigate();

  const [report, setReport] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");

  const datasetId =
    new URLSearchParams(
      window.location.search
    ).get("datasetId") ?? undefined;

  useEffect(() => {

    async function loadReport() {

      try {

        setLoading(true);

        const data =
          await getReport(datasetId);

        setReport(data);

        setError("");

      } catch (error) {

        console.error(
          "Report loading failed:",
          error
        );

        if (
          error instanceof Error &&
          error.message.includes("No valid datasets")
        ) {

          setError(
            "NO_DATASET"
          );

        } else {

          setError(
            "FAILED"
          );

        }

      } finally {

        setLoading(false);

      }

    }

    loadReport();

  }, [datasetId]);



  const handleGenerateReport = async () => {

    try {

      setGenerating(true);

      await downloadReport(
        "full",
        datasetId
      );

    } 
     
    catch (error) {

  console.error("Report loading failed:", error);

  if (
    typeof error === "object" &&
    error !== null
  ) {

    console.log("Status:", (error as any).status);
    console.log("Message:", (error as any).message);

  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as any).status === 404
  ) {

    setError("NO_DATASET");

  } else {

    setError("FAILED");

  }

}

  };



  if (loading) {

    return (

      <div className="flex h-64 items-center justify-center text-slate-400">

        Loading report...

      </div>

    );

  }



  if (error === "NO_DATASET") {

    return (

      <div className="flex min-h-[70vh] items-center justify-center">

        <div className="max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center shadow-lg">

          <div className="mb-5 text-6xl">
            📄
          </div>

          <h2 className="text-3xl font-bold text-white">

            No Reports Yet

          </h2>

          <p className="mt-4 text-slate-400">

            Upload a dataset to generate your first
            AI-powered business report.

          </p>

          <button

            onClick={() => navigate("/datasets")}

            className="mt-8 rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"

          >

            Upload Dataset

          </button>

        </div>

      </div>

    );

  }



  if (error) {

    return (

      <div className="flex h-64 items-center justify-center text-red-400">

        Failed to load report.

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
          datasetId={datasetId}
        />

        <ReportCard
          title="Business Health"
          description={`Business Health: ${report.businessHealth}%`}
          icon="💚"
          section="health"
          datasetId={datasetId}
        />

        <ReportCard
          title="AI Score"
          description={`Overall AI Score: ${report.aiScore}`}
          icon="🤖"
          section="ai-score"
          datasetId={datasetId}
        />

        <ReportCard
          title="Insights"
          description={`${report.insights.length} AI insights generated`}
          icon="💡"
          section="insights"
          datasetId={datasetId}
        />

        <ReportCard
          title="Warnings"
          description={`${report.warnings.length} warnings detected`}
          icon="⚠️"
          section="warnings"
          datasetId={datasetId}
        />

        <ReportCard
          title="Recommendations"
          description={`${report.recommendations.length} recommendations available`}
          icon="🚀"
          section="recommendations"
          datasetId={datasetId}
        />

      </div>

    </div>

  );

}

