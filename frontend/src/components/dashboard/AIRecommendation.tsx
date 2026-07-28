import { motion } from "framer-motion";
import { Brain } from "../ui/icons";

interface AIRecommendationProps {
  confidence: number;
}

export default function AIRecommendation({
  confidence,
}: AIRecommendationProps) {


  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -4,
      }}
      transition={{
        duration: 0.2,
      }}
      className="rounded-xl border border-cyan-500/20 bg-slate-800 p-5"
    >

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">
          <Brain
            className="text-cyan-400"
            size={20}
          />

          <span className="font-semibold">
            AI Recommendation
          </span>
        </div>


        <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
          High Priority
        </span>

      </div>


      <p className="mt-5 font-medium text-cyan-300">
        Increase stock of Product A
      </p>


      <p className="mt-2 text-sm text-slate-400">
        Predicted stock-out within the next 5 days based on recent sales trends.
      </p>

      <div className="mt-5 space-y-3">

  <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">

    <p className="text-xs uppercase tracking-wide text-slate-500">
      Why?
    </p>

    <p className="mt-1 text-sm text-slate-300">
      Sales velocity increased by 32% and customer demand is trending upward.
    </p>

  </div>


  <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">

    <p className="text-xs uppercase tracking-wide text-slate-500">
      Expected Impact
    </p>

    <p className="mt-1 font-semibold text-cyan-300">
      +12% Revenue Protection
    </p>

  </div>

</div>


      <div className="mt-5">

        <div className="mb-2 flex items-center justify-between text-sm">

          <span className="text-slate-400">
            AI Confidence
          </span>

          <span className="font-semibold text-cyan-400">
            {confidence.toFixed(1)}%
           </span>

        </div>
        <div className="mt-5 flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2">

  <div className="flex items-center gap-2">

    <span className="relative flex h-2.5 w-2.5">

      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />

      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />

    </span>


    <span className="text-sm text-green-300">
      {confidence > 90
        ? "Prediction Engine Healthy"
        : "Model Recalibrating"}
      
    </span>

  </div>


  <span className="text-xs text-slate-500">
    Just now
  </span>

</div>


        <div className="h-2 overflow-hidden rounded-full bg-slate-700">

          <motion.div
            initial={{
            width: 0,
              }}
           animate={{
             width: `${confidence}%`,
             }}
            transition={{
              duration: 1.4,
            }}
            className="h-full rounded-full bg-cyan-400"
          />

        </div>

      </div>


    </motion.div>
  );
}

