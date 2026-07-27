export default function Problem() {
  return (
    <section className="bg-slate-900 py-28 px-6">

      <div className="mx-auto max-w-7xl">

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            The Challenge
          </span>

          <h2 className="mt-8 text-4xl font-bold md:text-5xl">
            Businesses are drowning in
            <span className="text-cyan-400"> data</span>,
            but starving for
            <span className="text-cyan-400"> decisions.</span>
          </h2>

          <p className="mt-8 text-lg leading-8 text-slate-400">
            Every day businesses generate sales records,
            inventory reports, customer information,
            and operational metrics.
            Yet most of that data remains unused because
            analyzing it requires time, expertise, and expensive tools.
          </p>

        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8">

            <div className="text-5xl">📊</div>

            <h3 className="mt-6 text-xl font-semibold">
              Too Much Data
            </h3>

            <p className="mt-4 text-slate-400">
              Businesses collect spreadsheets and reports every day,
              but rarely extract meaningful insights.
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8">

            <div className="text-5xl">⏳</div>

            <h3 className="mt-6 text-xl font-semibold">
              Slow Decisions
            </h3>

            <p className="mt-4 text-slate-400">
              Manual analysis delays decisions and reduces the ability
              to respond quickly to market changes.
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8">

            <div className="text-5xl">📉</div>

            <h3 className="mt-6 text-xl font-semibold">
              Missed Opportunities
            </h3>

            <p className="mt-4 text-slate-400">
              Without AI-powered recommendations,
              businesses lose revenue, waste inventory,
              and overlook growth opportunities.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}


