interface Props {
  quality: number;
  duplicateRows: number;
  numericColumns: number;
  categoricalColumns: number;
  dateColumns: number;
}

export default function AIInsightsCard({
  quality,
  duplicateRows,
  numericColumns,
  categoricalColumns,
  dateColumns,
}: Props) {
  const insights: string[] = [];

  if (quality >= 95) {
    insights.push(
      "Excellent dataset quality detected. This dataset is ready for analysis."
    );
  } else if (quality >= 80) {
    insights.push(
      "Good dataset quality. Minor cleaning may improve model performance."
    );
  } else {
    insights.push(
      "Dataset quality is low. Cleaning is recommended before analysis."
    );
  }

  if (duplicateRows === 0) {
    insights.push("No duplicate records detected.");
  } else {
    insights.push(
      `${duplicateRows} duplicate rows were detected.`
    );
  }

  if (numericColumns > 0) {
    insights.push(
      `${numericColumns} numeric columns are suitable for statistical analysis.`
    );
  }

  if (categoricalColumns > 0) {
    insights.push(
      `${categoricalColumns} categorical columns can be grouped for comparison charts.`
    );
  }

  if (dateColumns > 0) {
    insights.push(
      `${dateColumns} date columns enable trend and time-series analysis.`
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-900 bg-cyan-950/20 p-6">
      <h2 className="mb-4 text-xl font-semibold text-cyan-300">
        🤖 AI Insights
      </h2>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-slate-300"
          >
            • {insight}
          </div>
        ))}
      </div>
    </div>
  );
}

