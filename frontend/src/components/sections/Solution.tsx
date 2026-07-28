export default function Solution() {
  return (
    <section
    id="solution"
    className="bg-slate-950 py-28 px-6">

      <div className="mx-auto max-w-7xl">

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400">
            The Solution
          </span>

          <h2 className="mt-8 text-4xl font-bold md:text-5xl">
            From Raw Data to
            <span className="text-cyan-400"> Intelligent Decisions</span>
          </h2>

          <p className="mt-8 text-lg leading-8 text-slate-400">
            Diralis uses Artificial Intelligence to transform business
            data into forecasts, recommendations, and actionable insights—
            helping organizations make faster, smarter decisions.
          </p>

        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-3">

          {/* Before */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">

            <h3 className="text-2xl font-bold text-red-400">
              Before Diralis
            </h3>

            <ul className="mt-8 space-y-5 text-slate-300">

              <li>📄 Excel Spreadsheets</li>
              <li>📊 Sales Reports</li>
              <li>📦 Inventory Logs</li>
              <li>📈 Business Metrics</li>

            </ul>

          </div>

          {/* AI */}
          <div className="flex flex-col items-center justify-center">

            <div className="rounded-full bg-cyan-500/10 p-8">

              <div className="text-6xl">
                🤖
              </div>

            </div>

            <h3 className="mt-6 text-3xl font-bold">
              Diralis AI
            </h3>

            <p className="mt-4 text-center text-slate-400">
              Analyze • Predict • Recommend
            </p>

          </div>

          {/* After */}
          <div className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-8">

            <h3 className="text-2xl font-bold text-cyan-400">
              After Diralis
            </h3>

            <ul className="mt-8 space-y-5 text-slate-300">

              <li>✅ Revenue Forecasts</li>
              <li>✅ AI Recommendations</li>
              <li>✅ Business Insights</li>
              <li>✅ Faster Decisions</li>

            </ul>

          </div>

        </div>

      </div>

    </section>
  );
}



