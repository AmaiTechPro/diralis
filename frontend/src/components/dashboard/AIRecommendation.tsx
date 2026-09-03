import { motion } from "framer-motion";
import { Brain } from "../ui/icons";

interface AIRecommendationProps {
  confidence: number;
  title?: string;
  description?: string;
  reason?: string;
  impact?: string;
  priority?: string;
  modelStatus?: string;
}

export default function AIRecommendation({
  confidence,
  title = "Inventory Velocity Optimization",
  description = "Autonomous analysis of transaction velocity and product run rates.",
  reason = "Identified via autonomous statistical distribution analysis.",
  impact = "Stabilizes forward-looking variance.",
  priority = "High Priority",
  modelStatus = "Operational",
}: AIRecommendationProps) {
  return (
    <motion.div
      whileHover={{
        scale: 1.01,
        y: -2,
      }}
      transition={{
        duration: 0.2,
      }}
      className="rounded-xl border border-cyan-500/20 bg-slate-900/90 p-5 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="text-cyan-400" size={20} />
          <span className="font-semibold text-slate-200">AI Recommendation</span>
        </div>

        <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300">
          {priority}
        </span>
      </div>

      <p className="mt-4 font-semibold text-cyan-300 text-lg">
        {title}
      </p>

      <p className="mt-2 text-sm text-slate-400 leading-relaxed">
        {description}
      </p>

      <div className="mt-5 space-y-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
            Statistical Driver
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {reason}
          </p>
        </div>

        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
            Expected Operational Impact
          </p>
          <p className="mt-1 font-semibold text-cyan-300">
            {impact}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-800/80">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">AI Model Confidence</span>
          <span className="font-semibold text-cyan-400">{confidence.toFixed(1)}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
            transition={{ duration: 1.2 }}
            className="h-full rounded-full bg-cyan-400"
          />
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-slate-300">
              Analysis Engine: {modelStatus}
            </span>
          </div>
          <span className="text-slate-500">Live Telemetry</span>
        </div>
      </div>
    </motion.div>
  );
}


