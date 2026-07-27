const reasons = [
  {
    icon: "🤖",
    title: "AI-First Decision Intelligence",
    description:
      "Go beyond dashboards with AI-powered recommendations that help you make confident business decisions.",
  },
  {
    icon: "⚡",
    title: "Fast & Simple",
    description:
      "Upload your business data and receive insights within minutes—no complicated setup required.",
  },
  {
    icon: "📈",
    title: "Built for Growing Businesses",
    description:
      "Designed for startups, SMEs, retailers, and organizations that want to scale using data.",
  },
  {
    icon: "🔒",
    title: "Secure by Design",
    description:
      "Your business data is handled securely with privacy and reliability at the core.",
  },
  {
    icon: "🌍",
    title: "Global Vision",
    description:
      "Built with businesses everywhere in mind, starting with practical challenges faced by growing companies.",
  },
  {
    icon: "💡",
    title: "Actionable Insights",
    description:
      "Don't just visualize your data—understand what actions to take next with AI guidance.",
  },
];

export default function WhyDiralis() {
  return (
    <section className="bg-slate-900 py-28 px-6">
      <div className="mx-auto max-w-7xl">

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400">
            Why Choose Diralis?
          </span>

          <h2 className="mt-8 text-4xl font-bold md:text-5xl">
            More Than Analytics.
            <span className="text-cyan-400"> Decision Intelligence.</span>
          </h2>

          <p className="mt-8 text-lg leading-8 text-slate-400">
            Traditional business intelligence platforms show you
            what happened. Diralis helps you understand what to
            do next.
          </p>

        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="rounded-3xl border border-slate-800 bg-slate-950 p-8 transition duration-300 hover:-translate-y-2 hover:border-cyan-500 hover:shadow-xl"
            >
              <div className="text-5xl">
                {reason.icon}
              </div>

              <h3 className="mt-6 text-2xl font-semibold">
                {reason.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-400">
                {reason.description}
              </p>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}


