const steps = [
  {
    number: "01",
    icon: "📤",
    title: "Upload Your Data",
    description:
      "Upload CSV files containing sales, inventory, customer, or operational business data.",
  },
  {
    number: "02",
    icon: "🤖",
    title: "AI Analysis",
    description:
      "Diralis analyzes your data using AI models to uncover patterns, trends, and opportunities.",
  },
  {
    number: "03",
    icon: "📊",
    title: "Interactive Dashboard",
    description:
      "View forecasts, KPIs, charts, and insights through a clean business dashboard.",
  },
  {
    number: "04",
    icon: "💡",
    title: "Take Action",
    description:
      "Receive AI-powered recommendations that help you make faster and smarter business decisions.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-slate-950 py-28 px-6"
    >
      <div className="mx-auto max-w-7xl">

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400">
            How It Works
          </span>

          <h2 className="mt-8 text-4xl font-bold md:text-5xl">
            Four Simple Steps to
            <span className="text-cyan-400"> Better Decisions</span>
          </h2>

          <p className="mt-8 text-lg leading-8 text-slate-400">
            Diralis transforms your business data into actionable insights
            through an intelligent AI-powered workflow.
          </p>

        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">

          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-8 transition duration-300 hover:-translate-y-2 hover:border-cyan-500"
            >

              <div className="flex items-center justify-between">

                <div className="text-5xl">
                  {step.icon}
                </div>

                <span className="text-sm font-bold text-cyan-400">
                  {step.number}
                </span>

              </div>

              <h3 className="mt-8 text-2xl font-semibold">
                {step.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-400">
                {step.description}
              </p>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}


