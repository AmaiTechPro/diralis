import { apiFetch } from "./apiClient";

export interface DashboardData {
  stats: {
    datasets: number;
    reports: number;
    dashboards: number;
    account: string;
  };

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
  return apiFetch<DashboardData>("/api/dashboard");
}

