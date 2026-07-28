import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts";

const data = [
  { month: "Jan", revenue: 18 },
  { month: "Feb", revenue: 24 },
  { month: "Mar", revenue: 22 },
  { month: "Apr", revenue: 31 },
  { month: "May", revenue: 36 },
  { month: "Jun", revenue: 42 },
];

export default function RevenueChart() {
  return (
    <div className="rounded-xl bg-slate-800 p-5">
      <h4 className="mb-4 font-semibold text-slate-200">
        Revenue Trend
      </h4>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="month"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#22d3ee"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


