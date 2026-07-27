const features = [
  {
    icon: "🤖",
    title: "AI Recommendations",
    description:
      "Receive intelligent recommendations that help improve business performance and decision-making.",
  },
  {
    icon: "📈",
    title: "Sales Forecasting",
    description:
      "Predict future trends using historical data and AI-powered forecasting models.",
  },
  {
    icon: "📂",
    title: "CSV Data Analysis",
    description:
      "Upload spreadsheets and instantly transform raw data into meaningful insights.",
  },
  {
    icon: "📊",
    title: "Interactive Dashboards",
    description:
      "Visualize KPIs, trends, and business metrics through beautiful dashboards.",
  },
  {
    icon: "🔔",
    title: "Smart Alerts",
    description:
      "Receive proactive notifications whenever important business changes occur.",
  },
  {
    icon: "📋",
    title: "Business Reports",
    description:
      "Generate clear AI-powered reports that are easy to share with your team.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="bg-slate-900 py-28 px-6"
    >
      <div className="mx-auto max-w-7xl">

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400">
            Platform Features
          </span>

          <h2 className="mt-8 text-4xl font-bold md:text-5xl">
            Everything You Need to Make
            <span className="text-cyan-400"> Smarter Decisions</span>
          </h2>

          <p className="mt-8 text-lg leading-8 text-slate-400">
            Diralis combines Artificial Intelligence, business analytics,
            and automation into one modern decision intelligence platform.
          </p>

        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-slate-800 bg-slate-950 p-8 transition duration-300 hover:-translate-y-2 hover:border-cyan-500 hover:shadow-xl"
            >
              <div className="text-5xl">
                {feature.icon}
              </div>

              <h3 className="mt-6 text-2xl font-semibold">
                {feature.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

