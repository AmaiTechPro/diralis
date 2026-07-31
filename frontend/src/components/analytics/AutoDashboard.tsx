import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import type { DatasetProfile } from "../../types/profile";

interface Props {
  visualizations: DatasetProfile["visualizations"];
}

const COLORS = [
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#3b82f6",
];

export default function AutoDashboard({
  visualizations,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

      <h2 className="mb-6 text-2xl font-bold">
        📊 Auto Generated Dashboard
      </h2>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* BAR CHART */}

        {visualizations.barChart && (
          <div className="rounded-xl bg-slate-950 p-4">

            <h3 className="mb-4 font-semibold">
              Bar Chart
            </h3>

            <div className="h-72">

              <ResponsiveContainer>

                <BarChart
                  data={visualizations.barChart.labels.map(
                    (label, i) => ({
                      label,
                      value:
                        visualizations.barChart!.values[i],
                    })
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="label" />

                  <YAxis />

                  <Tooltip />

                  <Bar dataKey="value" />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>
        )}

        {/* PIE CHART */}

        {visualizations.pieChart && (
          <div className="rounded-xl bg-slate-950 p-4">

            <h3 className="mb-4 font-semibold">
              Pie Chart
            </h3>

            <div className="h-72">

              <ResponsiveContainer>

                <PieChart>

                  <Pie
                    data={visualizations.pieChart.labels.map(
                      (label, i) => ({
                        name: label,
                        value:
                          visualizations.pieChart!.values[i],
                      })
                    )}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {visualizations.pieChart.labels.map(
                      (_, i) => (
                        <Cell
                          key={i}
                          fill={
                            COLORS[
                              i % COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>
        )}

        {/* LINE CHART */}

        {visualizations.lineChart && (
          <div className="rounded-xl bg-slate-950 p-4 lg:col-span-2">

            <h3 className="mb-4 font-semibold">
              Line Chart
            </h3>

            <div className="h-80">

              <ResponsiveContainer>

                <LineChart
                  data={visualizations.lineChart.labels.map(
                    (label, i) => ({
                      label,
                      value:
                        visualizations.lineChart!.values[i],
                    })
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="label" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="value"
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}

