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
    <section className="relative overflow-hidden flex min-h-screen items-center px-6 pt-20">

      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-20 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"></div>

        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl"></div>

        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl"></div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2">

        {/* Left */}
        <div className="flex flex-col justify-center">

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400">
            <Sparkles size={16} />
            Powered by AI Decision Intelligence
          </div>

          <h1 className="mt-8 text-5xl font-extrabold leading-tight md:text-7xl">
            Stop Guessing.
            <br />
            Start
            <span className="text-cyan-400"> Growing.</span>
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-8 text-slate-400">
            Diralis transforms spreadsheets, sales, inventory,
            and operational data into AI-powered recommendations,
            forecasts, and business insights in minutes.
          </p>

          <div className="mt-10 flex flex-wrap gap-5">

            <button className="rounded-xl bg-cyan-500 px-8 py-4 font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition duration-300 hover:-translate-y-1 hover:bg-cyan-400">
              Join Beta
            </button>

            <button className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-8 py-4 transition duration-300 hover:border-cyan-400 hover:bg-slate-800">
              Watch Demo
              <ArrowRight size={18} />
            </button>

          </div>

          <p className="mt-8 text-sm text-slate-500">
            Built for startups, SMEs, retailers, and operations teams.
          </p>

          {/* Trust Indicators */}
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

        {/* Right */}
        <div className="flex items-center justify-center">

          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl transition duration-300 hover:-translate-y-2 hover:border-cyan-500">

            <h3 className="mb-8 flex items-center gap-2 text-xl font-bold">
              <Brain className="text-cyan-400" size={24} />
              Live Decision Intelligence
            </h3>

            <div className="space-y-5">

              <div className="rounded-xl bg-slate-800 p-5">

                <div className="flex items-center gap-3">
                  <TrendingUp className="text-green-400" size={20} />
                  <span>Revenue Forecast</span>
                </div>

                <div className="mt-2 text-2xl font-bold text-green-400">
                  +18%
                </div>

              </div>

              <div className="rounded-xl bg-slate-800 p-5">

                <div className="flex items-center gap-3">
                  <TriangleAlert className="text-yellow-400" size={20} />
                  <span>Inventory Risk</span>
                </div>

                <div className="mt-2 text-2xl font-bold text-yellow-400">
                  Low
                </div>

              </div>

              <div className="rounded-xl bg-slate-800 p-5">

                <div className="flex items-center gap-3">
                  <Users className="text-cyan-400" size={20} />
                  <span>Customer Growth</span>
                </div>

                <div className="mt-2 text-2xl font-bold text-cyan-400">
                  +24%
                </div>

              </div>

              <div className="rounded-xl bg-slate-800 p-5">

                <div className="flex items-center gap-3">
                  <Gauge className="text-green-400" size={20} />
                  <span>Operational Efficiency</span>
                </div>

                <div className="mt-2 text-2xl font-bold text-green-400">
                  91%
                </div>

              </div>

              <div className="rounded-xl bg-slate-800 p-5">

                <div className="flex items-center gap-3">
                  <Brain className="text-cyan-400" size={20} />
                  <span>AI Recommendation</span>
                </div>

                <div className="mt-2 text-cyan-400">
                  Increase stock of Product A
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}


