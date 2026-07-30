import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import type { DatasetProfile } from "../../types/profile";

import QualityScoreCard from "./QualityScoreCard";
import DatasetStatistics from "./DatasetStatistics";
import ChartRecommendationCard from "./ChartRecommendationCard";

interface Props {
  open: boolean;
  onClose: () => void;
  profile: DatasetProfile | null;
  loading: boolean;
}

export default function AnalyticsModal({
  open,
  onClose,
  profile,
  loading,
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
              className="absolute right-6 top-6 rounded-xl p-2 transition hover:bg-slate-800"
            >
              <X size={22} />
            </button>

            <h1 className="text-3xl font-bold">
              Dataset Analytics
            </h1>

            {loading ? (
              <div className="py-20 text-center text-slate-400">
                Loading analytics...
              </div>
            ) : !profile ? (
              <div className="py-20 text-center text-red-400">
                Failed to load analytics.
              </div>
            ) : (
              <>
                <p className="mt-3 text-slate-400">
                  {profile.dataset.name}
                </p>

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


