export function getDashboardData() {
  return {
    revenueForecast: 18,
    customerGrowth: 24381,
    operationalEfficiency: 91,
    inventoryRisk: "Low",

    aiConfidence: 97,

    recommendation: {
      priority: "High",
      title: "Increase stock of Product A",
      description:
        "Predicted stock-out within the next 5 days based on recent sales trends.",
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


