export default function DashboardPreview() {
  return (
    <section 
    id="dashboard-preview"
    className="bg-slate-950 py-28 px-6">

      <div className="mx-auto max-w-7xl">

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400">
            Product Preview
          </span>

          <h2 className="mt-8 text-4xl font-bold md:text-5xl">
            See Your Business Through
            <span className="text-cyan-400"> AI Eyes</span>
          </h2>

          <p className="mt-8 text-lg leading-8 text-slate-400">
            A modern dashboard that transforms raw business data into
            actionable insights, forecasts, and intelligent recommendations.
          </p>

        </div>

        <div className="mt-20 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

          {/* Top Stats */}

          <div className="grid gap-6 md:grid-cols-4">

            <div className="rounded-2xl bg-slate-800 p-6">

              <p className="text-sm text-slate-400">
                Revenue
              </p>

              <h3 className="mt-3 text-3xl font-bold text-green-400">
                +18%
              </h3>

            </div>

            <div className="rounded-2xl bg-slate-800 p-6">

              <p className="text-sm text-slate-400">
                Customer Growth
              </p>

              <h3 className="mt-3 text-3xl font-bold text-cyan-400">
                +24%
              </h3>

            </div>

            <div className="rounded-2xl bg-slate-800 p-6">

              <p className="text-sm text-slate-400">
                Inventory Health
              </p>

              <h3 className="mt-3 text-3xl font-bold text-yellow-400">
                92%
              </h3>

            </div>

            <div className="rounded-2xl bg-slate-800 p-6">

              <p className="text-sm text-slate-400">
                AI Confidence
              </p>

              <h3 className="mt-3 text-3xl font-bold text-cyan-400">
                98%
              </h3>

            </div>

          </div>

          {/* Dashboard */}

          <div className="mt-10 grid gap-8 lg:grid-cols-3">

            {/* Left */}

            <div className="lg:col-span-2 rounded-2xl bg-slate-800 p-8">

              <h3 className="text-xl font-semibold">
                Sales Trend
              </h3>

              <div className="mt-8 flex h-64 items-end justify-between gap-3">

                <div className="w-full rounded-t bg-cyan-500 h-20"></div>
                <div className="w-full rounded-t bg-cyan-500 h-28"></div>
                <div className="w-full rounded-t bg-cyan-500 h-36"></div>
                <div className="w-full rounded-t bg-cyan-500 h-44"></div>
                <div className="w-full rounded-t bg-cyan-500 h-56"></div>
                <div className="w-full rounded-t bg-cyan-500 h-48"></div>
                <div className="w-full rounded-t bg-cyan-500 h-60"></div>

              </div>

            </div>

            {/* Right */}

            <div className="rounded-2xl bg-slate-800 p-8">

              <h3 className="text-xl font-semibold">
                AI Recommendation
              </h3>

              <div className="mt-8 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-5">

                <p className="font-semibold text-cyan-400">
                  High Priority
                </p>

                <p className="mt-4 text-slate-300">

                  Increase inventory for Product A.

                  Demand is expected to rise by

                  <span className="font-bold text-white">
                    {" "}23%
                  </span>

                  over the next 30 days.

                </p>

              </div>

              <div className="mt-6 rounded-xl bg-slate-700 p-5">

                <p className="text-slate-400">
                  Risk Level
                </p>

                <h3 className="mt-2 text-2xl font-bold text-green-400">
                  Low
                </h3>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}


