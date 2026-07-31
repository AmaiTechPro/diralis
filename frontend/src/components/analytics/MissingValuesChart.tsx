import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  missing: Record<string, number>;
}

export default function MissingValuesChart({
  missing,
}: Props) {
  const data = Object.entries(missing)
    .map(([column, value]) => ({
      column,
      missing: value,
    }))
    .filter((item) => item.missing > 0);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">
          Missing Values
        </h2>

        <p className="mt-6 text-green-400">
          ✅ No missing values detected.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-5 text-xl font-semibold">
        Missing Values
      </h2>

      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="column" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="missing"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


