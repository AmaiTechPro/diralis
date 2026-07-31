import { classifyColumn } from "./classifyColumn";

export function selectBestColumns(
  numericColumns: string[],
  categoricalColumns: string[],
  dateColumns: string[]
) {

  const metric =
    numericColumns.find(
      column => classifyColumn(column) === "metric"
    );

  const category =
    categoricalColumns.find(
      column => classifyColumn(column) === "category"
    );

  const date =
    dateColumns.find(
      column => classifyColumn(column) === "date"
    );

  return {

    metric,

    category,

    date,

  };

}

