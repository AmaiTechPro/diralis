import KpiCard from "../ui/KpiCard";
import { motion } from "framer-motion";
import FadeIn from "../ui/FadeIn";
import RevenueChart from "../dashboard/RevenueChart";

import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  TriangleAlert,
  Users,
  Gauge,
  Brain,
} from "../ui/icons";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-20">

      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-20 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      
      <div className="mx-auto grid max-w-7xl items-center gap-14 md:gap-16 lg:grid-cols-2">
        {/* Left */}
        <FadeIn>
          <div className="flex flex-col justify-center">

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Sparkles size={16} />
              Powered by AI Decision Intelligence
            </div>

            <h1 className="mt-8 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-7xl">
              Stop Guessing.
              <br />
              Start
              <span className="text-cyan-400"> Growing Smarter.</span>
            </h1>

            <p className="mt-8 max-w-lg text-lg leading-8 text-slate-400 lg:max-w-xl">
              Diralis transforms spreadsheets, operational metrics,
              sales reports, and inventory data into AI-powered
              recommendations, predictive forecasts, and actionable
              business insights—helping you make confident decisions
              in minutes.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">

              <motion.button
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-xl bg-cyan-500 px-8 py-4 font-semibold text-slate-950 shadow-lg shadow-cyan-500/30"
              >
                Join Beta
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-8 py-4 transition hover:border-cyan-400 hover:bg-slate-800"
              >
                Watch Demo
                <ArrowRight size={18} />
              </motion.button>

            </div>

            <p className="mt-8 text-sm text-slate-500">
              Built for startups, SMEs, retailers, and operations teams.
            </p>

            <div className="mt-8 flex flex-wrap gap-5 text-sm">

              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 size={18} className="text-cyan-400" />
                AI Recommendations
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 size={18} className="text-cyan-400" />
                Forecasting
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 size={18} className="text-cyan-400" />
                CSV Uploads
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 size={18} className="text-cyan-400" />
                Business Insights
              </div>

            </div>

          </div>
        </FadeIn>

        {/* Right */}
        <FadeIn delay={0.25}>
          <div className="flex items-center justify-center">

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: "easeInOut",
              }}
              className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl transition hover:border-cyan-500"
            >

              

              <div className="space-y-5">

  <KpiCard
  title="Revenue Forecast"
  value={18}
  prefix="+"
  suffix="%"
  icon={<TrendingUp size={20} />}
  color="text-green-400"
  delay={0}
/>

<KpiCard
  title="Inventory Risk"
  value="Low"
  icon={<TriangleAlert size={20} />}
  color="text-yellow-400"
  delay={0.1}
/>

<KpiCard
  title="Customer Growth"
  value={24}
  prefix="+"
  suffix="%"
  icon={<Users size={20} />}
  color="text-cyan-400"
  delay={0.2}
/>

<KpiCard
  title="Operational Efficiency"
  value={91}
  suffix="%"
  icon={<Gauge size={20} />}
  color="text-green-400"
  delay={0.3}
/>

  <motion.div
    whileHover={{
      scale: 1.02,
      y: -4,
    }}
    transition={{ duration: 0.2 }}
    className="rounded-xl border border-cyan-500/20 bg-slate-800 p-5"
  >
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-3">
        <Brain className="text-cyan-400" size={20} />
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

    <div className="mt-5">

      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-400">
          AI Confidence
        </span>

        <span className="font-semibold text-cyan-400">
          97%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-700">

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "97%" }}
          transition={{ duration: 1.4 }}
          className="h-full rounded-full bg-cyan-400"
        />

            </div>
    </div>

  </motion.div> {/* End AI Recommendation */}
<RevenueChart />  {/* End Revenue Chart */}
</div> {/* End space-y-5 */}

</motion.div> {/* End floating dashboard */}

</div> {/* End flex items-center */}

        </FadeIn>

      </div>
    </section>
  );
}
