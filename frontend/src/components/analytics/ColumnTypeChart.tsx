import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  numeric: number;
  categorical: number;
  date: number;
}

const COLORS = [
  "#06b6d4",
  "#22c55e",
  "#facc15",
];

export default function ColumnTypeChart({
  numeric,
  categorical,
  date,
}: Props) {
  const data = [
    {
      name: "Numeric",
      value: numeric,
    },
    {
      name: "Categorical",
      value: categorical,
    },
    {
      name: "Date",
      value: date,
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-5 text-xl font-semibold">
        Column Distribution
      </h2>

      <div className="h-72">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index]}
                />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

