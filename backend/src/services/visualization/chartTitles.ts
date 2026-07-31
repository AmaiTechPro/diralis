export function generateChartTitle(
  chart: "bar" | "pie" | "line",
  category?: string,
  numeric?: string,
  date?: string
) {

  switch (chart) {

    case "bar":
      return numeric && category
        ? `${numeric} by ${category}`
        : "Bar Chart";

    case "pie":
      return category
        ? `Distribution by ${category}`
        : "Pie Chart";

    case "line":
      return numeric && date
        ? `${numeric} Over ${date}`
        : "Trend Over Time";

    default:
      return "Chart";
  }

}

