import prisma from "../lib/prisma";

export async function getDashboardData() {
  const datasets = await prisma.dataset.count();

  return {
    stats: {
      datasets,
      reports: datasets,
      dashboards: datasets > 0 ? 1 : 0,
      account: "Active",
    },

    revenueForecast: 18,
    customerGrowth: 24381,
    operationalEfficiency: 91,
    inventoryRisk: "Low",

    aiConfidence: 97,

    recommendation: {
      priority: datasets > 0 ? "High" : "Info",

      title:
        datasets > 0
          ? `${datasets} dataset${datasets > 1 ? "s" : ""} successfully analyzed`
          : "Upload your first dataset",

      description:
        datasets > 0
          ? `Diralis has analyzed your ${datasets} uploaded dataset${datasets > 1 ? "s" : ""}. AI insights, dashboards, reports and forecasting are now available.`
          : "Upload a dataset to unlock AI-powered insights, dashboards, reports and forecasting.",
    },

    chart: [
      { month: "Jan", revenue: 18 },
      { month: "Feb", revenue: 24 },
      { month: "Mar", revenue: 22 },
      { month: "Apr", revenue: 31 },
      { month: "May", revenue: 36 },
      { month: "Jun", revenue: 42 },
    ],
  };
}

