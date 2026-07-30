import { motion } from "framer-motion";

interface Props {
  score: number;
}

export default function QualityScoreCard({
  score,
}: Props) {
  const color =
    score >= 90
      ? "text-green-400"
      : score >= 70
      ? "text-yellow-400"
      : "text-red-400";

  const border =
    score >= 90
      ? "border-green-500/30"
      : score >= 70
      ? "border-yellow-500/30"
      : "border-red-500/30";

  const message =
    score >= 90
      ? "Excellent dataset quality"
      : score >= 70
      ? "Good quality with minor issues"
      : "Dataset requires cleaning";

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
      }}
      className={`rounded-2xl border ${border} bg-slate-900 p-6 shadow-lg`}
    >
      <h2 className="text-lg font-semibold text-slate-300">
        Data Quality
      </h2>

      <div className="mt-6 flex items-center justify-center">
        <div
          className={`text-6xl font-extrabold ${color}`}
        >
          {score}
        </div>

        <span className="ml-2 mt-5 text-2xl text-slate-500">
          /100
        </span>
      </div>

      <p
        className={`mt-6 text-center text-sm font-medium ${color}`}
      >
        {message}
      </p>
    </motion.div>
  );
}

