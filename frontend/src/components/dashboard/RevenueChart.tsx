import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts";

interface RevenueChartProps {
  revenueHistory?: number[];
  labels?: string[];
}

export default function RevenueChart({
  revenueHistory = [],
  labels = [],
}: RevenueChartProps) {
  const hasData = revenueHistory.length > 0;

  const data = hasData
    ? revenueHistory.map((value, index) => ({
        label: labels[index] || `Period ${index + 1}`,
        revenue: value,
      }))
    : [];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
      <h4 className="mb-4 font-semibold text-slate-200">
        Revenue & Metric Trajectory
      </h4>

      <div className="h-48 flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="label"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.5rem",
                  color: "#f8fafc",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                animationDuration={1200}
                stroke="#22d3ee"
                strokeWidth={3}
                dot={{ r: 4, fill: "#22d3ee" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-xs text-slate-500">
            No chronological series detected in current dataset.
          </div>
        )}
      </div>
    </div>
  );
}


