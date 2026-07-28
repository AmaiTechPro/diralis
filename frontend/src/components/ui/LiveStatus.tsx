import { motion } from "framer-motion";
import { Activity } from "./icons";

export default function LiveStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 rounded-xl border border-cyan-500/20 bg-slate-800/70 p-4 backdrop-blur-md"
    >
      <div className="flex items-center justify-between">

        {/* Left */}
        <div className="flex items-center gap-3">

          <div className="relative flex h-3 w-3">

            <motion.span
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.7, 0, 0.7],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              className="absolute inline-flex h-full w-full rounded-full bg-green-400"
            />

            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-400" />

          </div>


          <div>
            <p className="text-sm font-semibold text-white">
              AI Engine Active
            </p>

            <p className="text-xs text-slate-400">
              Updated just now
            </p>
          </div>

        </div>


        {/* Right */}
        <div className="flex items-center gap-2 text-sm text-cyan-400">

          <Activity size={16} />

          <span>
            99.97%
          </span>

        </div>


      </div>
    </motion.div>
  );
}

