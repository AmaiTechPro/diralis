export interface DashboardChart {
  type: "bar" | "pie" | "line";
  priority: number;
}

export function planDashboard(
  numericColumns: string[],
  categoricalColumns: string[],
  dateColumns: string[]
): DashboardChart[] {

  const charts: DashboardChart[] = [];

  // Time-series datasets
  if (
    dateColumns.length > 0 &&
    numericColumns.length > 0
  ) {

    charts.push({
      type: "line",
      priority: 100,
    });

  }

  // Category vs numeric
  if (
    categoricalColumns.length > 0 &&
    numericColumns.length > 0
  ) {

    charts.push({
      type: "bar",
      priority: 95,
    });

  }

  // Pure categorical datasets
  if (
    categoricalColumns.length > 0 &&
    numericColumns.length === 0
  ) {

    charts.push({
      type: "pie",
      priority: 90,
    });

  }

  return charts.sort(
    (a, b) => b.priority - a.priority
  );

}

