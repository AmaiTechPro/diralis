interface Props {
  score: number;
  duplicates: number;
  missing: Record<string, number>;
}

export default function QualityBreakdownCard({
  score,
  duplicates,
  missing,
}: Props) {
  const missingCount = Object.values(missing)
    .reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

      <h2 className="mb-5 text-xl font-semibold">
        Quality Breakdown
      </h2>

      <div className="space-y-4">

        <div className="flex justify-between">
          <span>Quality Score</span>
          <span className="font-bold text-cyan-400">
            {score}/100
          </span>
        </div>

        <div className="flex justify-between">
          <span>Missing Values</span>
          <span className="font-bold">
            {missingCount}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Duplicate Rows</span>
          <span className="font-bold">
            {duplicates}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Status</span>

          <span
            className={`font-bold ${
              score >= 90
                ? "text-green-400"
                : score >= 70
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {score >= 90
              ? "Excellent"
              : score >= 70
              ? "Good"
              : "Needs Cleaning"}
          </span>
        </div>

      </div>
    </div>
  );
}

