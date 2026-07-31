import { rankColumns } from "./visualization/columnScorer";
import { topCategories } from "./visualization/topCategories";
import { generateChartTitle } from "./visualization/chartTitles";
import { planDashboard } from "./visualization/dashboardPlanner";

import { selectBestColumns }
from "./visualization/intelligence/selectBestColumns";


type VisualizationData = {
  title: string;
  labels: string[];
  values: number[];
};

export interface VisualizationResult {
  barChart?: VisualizationData;
  pieChart?: VisualizationData;
  lineChart?: VisualizationData;
}

function pickNumericColumn(
  columns: string[]
) {
  return columns[0];
}

export function generateVisualizations(
  rows: Record<string, unknown>[],
  numericColumns: string[],
  categoricalColumns: string[],
  dateColumns: string[]
): VisualizationResult {

  const result: VisualizationResult = {};

  const dashboard =
    planDashboard(
      numericColumns,
      categoricalColumns,
      dateColumns
    );

  const hasChart = (
    type: "bar" | "pie" | "line"
  ) =>
    dashboard.some(
      chart => chart.type === type
    );

  const best =
  selectBestColumns(
    numericColumns,
    categoricalColumns,
    dateColumns
  );

  {/* For Debugging Only! */}

   console.log("========== AI COLUMN SELECTION ==========");
   console.log(best);
  console.log("=========================================");

    {/*End of Debugging! */}
    
const category =
  best.category;

const numeric =
  best.metric;

const bestDate =
  best.date;

  // ==========================
  // BAR + PIE
  // ==========================
  if (
  hasChart("bar") &&
  category &&
  numeric &&
  numeric !== "Index"
)
  
  {

    const grouped =
      new Map<string, number>();

    for (const row of rows) {

      const label =
        String(row[category] ?? "Unknown");

      const value =
        Number(row[numeric]) || 0;

      grouped.set(
        label,
        (grouped.get(label) || 0) + value
      );

    }

    const sorted =
      [...grouped.entries()]
        .sort((a, b) => b[1] - a[1]);

    const labels =
      sorted.map(item => item[0]);

    const values =
      sorted.map(item => item[1]);

    const barData =
      topCategories(
        labels,
        values,
        10
      );

    result.barChart = {
      title: generateChartTitle(
        "bar",
        category,
        numeric
      ),
      labels: barData.labels,
      values: barData.values,
    };

    if (hasChart("pie")) {

      const pieData =
        topCategories(
          labels,
          values,
          5
        );

      result.pieChart = {
        title: generateChartTitle(
          "pie",
          category
        ),
        labels: pieData.labels,
        values: pieData.values,
      };

    }

  }

  // ==========================
  // LINE
  // ==========================
  if (
  bestDate &&
  numeric &&
  numeric !== "Index"
)
  
  {

    const date =
  bestDate;

    const grouped =
      new Map<string, number>();

    for (const row of rows) {

      const label =
        String(row[date] ?? "");

      const value =
        Number(row[numeric]) || 0;

      grouped.set(
        label,
        (grouped.get(label) || 0) + value
      );

    }

    result.lineChart = {
      title: generateChartTitle(
        "line",
        undefined,
        numeric,
        date
      ),
      labels: [...grouped.keys()],
      values: [...grouped.values()],
    };

  }

  return result;

}

