import { useEffect, useState } from "react";
import {
  type DashboardData,
  getDashboardData,
} from "../api/dashboard";

export function useDashboard() {
  const [dashboardData, setDashboardData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  return {
    dashboardData,
    loading,
    error,
  };
}

