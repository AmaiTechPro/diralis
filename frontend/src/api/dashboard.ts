import { apiFetch } from "./apiClient";

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

export function getDashboardData() {
  return apiFetch<DashboardData>("/dashboard");
}

