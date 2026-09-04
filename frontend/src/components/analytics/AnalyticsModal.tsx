import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";

import type { DatasetProfile } from "../../types/profile";

import KpiCard from "./KpiCard";
import QualityScoreCard from "./QualityScoreCard";
import DatasetStatistics from "./DatasetStatistics";
import ColumnTypeChart from "./ColumnTypeChart";
import MissingValuesChart from "./MissingValuesChart";
import ChartRecommendationCard from "./ChartRecommendationCard";
import AIInsightsCard from "./AIInsightsCard";
import QualityBreakdownCard from "./QualityBreakdownCard";
import AutoDashboard from "./AutoDashboard";

interface Props {
  open: boolean;
  onClose: () => void;
  profile: DatasetProfile | null;
  loading: boolean;
  error?: string | null;
}

export default function AnalyticsModal({
  open,
  onClose,
  profile,
  loading,
  error,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
            }}
            transition={{
              duration: 0.25,
            }}
            className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 rounded-xl p-2 transition hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X size={22} />
            </button>

            <h1 className="text-3xl font-bold">Dataset Analytics</h1>

            {loading ? (
              <div className="py-20 text-center text-slate-400">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent align-[-0.125em] mb-4" />
                <p>Loading analytics...</p>
              </div>
            ) : error || !profile ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle size={28} />
                </div>
                <h3 className="text-lg font-semibold text-slate-200">
                  Failed to Load Analytics
                </h3>
                <p className="mt-2 max-w-md mx-auto text-sm text-slate-400">
                  {error || "The dataset file is missing from the server. If the server restarted or redeployed, please delete and re-upload the dataset file."}
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="mt-3 text-slate-400">
                  {profile.dataset.name}
                </p>

                {/* KPI Cards */}
                <div className="mt-8 grid gap-5 md:grid-cols-4">
                  <KpiCard
                    title="Rows"
                    value={profile.profile.rows}
                    color="text-cyan-400"
                  />

                  <KpiCard
                    title="Columns"
                    value={profile.profile.columns}
                    color="text-green-400"
                  />

                  <KpiCard
                    title="Quality"
                    value={`${profile.profile.quality.score}%`}
                    color="text-yellow-400"
                  />

                  <KpiCard
                    title="Duplicates"
                    value={profile.profile.duplicateRows}
                    color="text-red-400"
                  />
                </div>

                {/* Top Analytics */}
                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <QualityScoreCard
                    score={profile.profile.quality.score}
                  />

                  <DatasetStatistics
                    rows={profile.profile.rows}
                    columns={profile.profile.columns}
                    numericColumns={
                      profile.profile.numericColumns.length
                    }
                    categoricalColumns={
                      profile.profile.categoricalColumns.length
                    }
                    dateColumns={
                      profile.profile.dateColumns.length
                    }
                    duplicateRows={
                      profile.profile.duplicateRows
                    }
                  />
                </div>

                {/* Charts */}
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <ColumnTypeChart
                    numeric={
                      profile.profile.numericColumns.length
                    }
                    categorical={
                      profile.profile.categoricalColumns.length
                    }
                    date={
                      profile.profile.dateColumns.length
                    }
                  />

                  <MissingValuesChart
                    missing={
                      profile.profile.missingValues
                    }
                  />
                </div>

                {/* AI Insights */}
                <div className="mt-6">
                  <AIInsightsCard
                    summary={profile.insights.summary}
                    quality={profile.insights.quality ?? []}
                    statistics={profile.insights.statistics ?? []}
                    anomalies={profile.insights.anomalies ?? []}
                    business={profile.insights.business ?? []}
                    forecast={profile.insights.forecast ?? []}
                    kpis={profile.insights.kpis ?? []}
                    rootCauses={profile.insights.rootCauses ?? []}
                  />
                </div>

                {/* Quality Breakdown */}
                <div className="mt-6">
                  <QualityBreakdownCard
                    score={profile.profile.quality.score}
                    duplicates={profile.profile.duplicateRows}
                    missing={profile.profile.missingValues}
                  />
                </div>

                {/* Auto Dashboard */}
                <div className="mt-6">
                  <AutoDashboard
                    visualizations={
                      profile.visualizations
                    }
                  />
                </div>

                {/* AI Recommendations */}
                <div className="mt-6">
                  <ChartRecommendationCard
                    charts={
                      profile.profile.recommendedCharts
                    }
                  />
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


