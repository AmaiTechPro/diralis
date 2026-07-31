type VisualizationData = {
  labels: string[];
  values: number[];
};

export interface VisualizationResult {
  barChart?: VisualizationData;
  pieChart?: VisualizationData;
  lineChart?: VisualizationData;
}


function isUsefulCategory(column: string) {
  const blocked = [
    "id",
    "email",
    "phone",
    "website",
    "url",
    "name"
  ];

  return !blocked.some(word =>
    column.toLowerCase().includes(word)
  );
}


function pickCategoryColumn(
  columns: string[]
) {
  return columns.find(isUsefulCategory);
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

  const category =
    pickCategoryColumn(categoricalColumns);

  const numeric =
    pickNumericColumn(numericColumns);


  // ---------- BAR & PIE ----------
  if (category && numeric) {

    const grouped = new Map<string, number>();

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


    result.barChart = {
      labels: [...grouped.keys()],
      values: [...grouped.values()],
    };


    result.pieChart = result.barChart;
  }


  // ---------- LINE ----------
  if (
    dateColumns.length > 0 &&
    numeric
  ) {

    const date = dateColumns[0];

    const grouped = new Map<string, number>();

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
      labels: [...grouped.keys()],
      values: [...grouped.values()],
    };
  }


  return result;
}

