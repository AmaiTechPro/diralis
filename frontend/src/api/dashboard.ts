export interface DashboardData {
  revenueForecast: number;
  customerGrowth: number;
  operationalEfficiency: number;
  inventoryRisk: string;
  aiConfidence: number;

  recommendation: {
    priority: string;
    title: string;
    description: string;
  };

  chart: {
    month: string;
    revenue: number;
  }[];
}

const API_URL = "http://localhost:5000/api/dashboard";

export async function getDashboardData(): Promise<DashboardData> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return response.json();
}


