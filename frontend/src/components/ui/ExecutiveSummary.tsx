interface Props {
  summary: string;
}

export default function ExecutiveSummary({
  summary,
}: Props) {
  return (
    <div className="rounded-3xl border border-cyan-900 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-lg">

      <div className="mb-6 flex items-center gap-3">

        <div className="text-3xl">
          🧠
        </div>

        <div>

          <h2 className="text-2xl font-bold text-white">
            Executive Summary
          </h2>

          <p className="text-slate-400">
            AI-generated overview of your organization.
          </p>

        </div>

      </div>

      <p className="leading-8 text-slate-300">
        {summary}
      </p>

    </div>
  );
}

