import { motion } from "framer-motion";
import {
  BarChart3,
  LineChart,
  PieChart,
  ChartColumn,
} from "lucide-react";

interface Props {
  charts: string[];
}

function getIcon(chart: string) {
  const value = chart.toLowerCase();

  if (value.includes("line")) {
    return <LineChart size={20} />;
  }

  if (value.includes("pie")) {
    return <PieChart size={20} />;
  }

  if (value.includes("histogram")) {
    return <ChartColumn size={20} />;
  }

  return <BarChart3 size={20} />;
}

export default function ChartRecommendationCard({
  charts,
}: Props) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
        delay: 0.2,
      }}
      className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
    >
      <h2 className="text-lg font-semibold text-slate-300">
        Recommended Visualizations
      </h2>

      {charts.length === 0 ? (
        <p className="mt-6 text-slate-500">
          No recommendations available.
        </p>
      ) : (
        <div className="mt-6 space-y-3">

          {charts.map((chart) => (
            <div
              key={chart}
              className="flex items-center gap-3 rounded-xl bg-slate-800/60 px-4 py-3 transition hover:bg-slate-800"
            >
              <div className="text-cyan-400">
                {getIcon(chart)}
              </div>

              <span className="font-medium text-slate-200">
                {chart}
              </span>
            </div>
          ))}

        </div>
      )}
    </motion.div>
  );
}


