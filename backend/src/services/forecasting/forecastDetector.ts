export function detectForecastCapability(
  context:any
):boolean {


  const columns =
    [
      ...context.numericColumns,
      ...context.dateColumns
    ]
    .map(
      c => c.toLowerCase()
    );


  const hasDate =
    columns.some(
      c =>
      c.includes("date") ||
      c.includes("time") ||
      c.includes("month")
    );


  const hasMetric =
    columns.some(
      c =>
      c.includes("sales") ||
      c.includes("revenue") ||
      c.includes("amount") ||
      c.includes("price")
    );


  return hasDate && hasMetric;

}

