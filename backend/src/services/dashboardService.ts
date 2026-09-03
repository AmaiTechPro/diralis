import prisma from "../lib/prisma";
import { getLatestDataset } from "./datasetService";
import { parseDataset } from "./datasetFileService";
import { profileDataset } from "./profiler/profileDataset";
import { generateInsights } from "./insights/generateInsights";
import { getCanonicalDatasetRows } from "./canonicalDataService";


export async function getDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const datasetsCount =
    user.role === "ADMIN"
      ? await prisma.dataset.count()
      : await prisma.dataset.count({ where: { userId } });

  const canonicalData = await getCanonicalDatasetRows(userId);
  const totalSources = datasetsCount + (canonicalData ? 1 : 0);

  // Only return empty state if BOTH manual datasets and canonical connections are absent
  if (totalSources === 0) {
    return {
      stats: {
        datasets: 0,
        reports: 0,
        dashboards: 0,
        account: "Active",
      },
      revenueForecast: 0,
      customerGrowth: 0,
      operationalEfficiency: 0,
      inventoryRisk: "N/A",
      aiConfidence: 0,
      recommendation: {
        priority: "Info",
        title: "Connect Shopify or upload a dataset",
        description:
          "Upload a CSV or Excel dataset, or connect a POS/e-commerce store to unlock real-time business intelligence and forecasts.",
        reason: "No transactional data detected in this workspace yet.",
        impact: "Enables automated KPI tracking, anomaly alerts, and revenue predictions.",
        modelStatus: "Awaiting Data",
      },
      chart: [],
    };
  }

  let operationalEfficiency = 85;
  let aiConfidence = 80;
  let inventoryRisk = "Low";
  let totalRecords = 0;
  let recommendationTitle = `${totalSources} data source${totalSources > 1 ? "s" : ""} active`;
  let recommendationDescription = "Data health is optimal. Analytics and reports are current.";
  let recommendationReason = "Multi-variable profiling completed without critical blockers.";
  let recommendationImpact = "High-accuracy decision confidence across active metrics.";
  let modelStatus = "Operational";

  try {
    let rows: Record<string, any>[] = [];

    const latestDataset = await getLatestDataset(userId);
    if (latestDataset) {
      rows = await parseDataset(latestDataset.id);
    } else if (canonicalData) {
      rows = canonicalData.rows;
    }

    if (rows.length > 0) {
      totalRecords = rows.length;
      const profile = profileDataset(rows);
      const insights = generateInsights(profile);

      operationalEfficiency = profile.quality.score;
      aiConfidence = Math.max(50, Math.min(99, profile.quality.score - (profile.quality.issues?.length || 0) * 5));

      if (profile.quality.issues && profile.quality.issues.length > 2) {
        inventoryRisk = "Elevated";
      }

      if (insights.anomalies.length > 0) {
        recommendationTitle = `Review ${profile.numericColumns[0] || "transaction"} variations`;
        recommendationDescription = insights.anomalies[0];
        recommendationReason = "Statistical outlier detected relative to column spread.";
        recommendationImpact = "Mitigates forecasting skew and operational drift.";
      } else if (insights.kpis.length > 0) {
        recommendationTitle = `Monitor key KPI: ${profile.numericColumns[0] || "Primary Metric"}`;
        recommendationDescription = insights.kpis[0];
        recommendationReason = "High correlation or stability detected in core numeric series.";
        recommendationImpact = "Stabilizes forward-looking variance.";
      }
    }
  } catch (err) {
    console.warn("[dashboardService] Grounding fallback applied:", (err as Error).message);
  }

  return {
    stats: {
      datasets: totalSources,
      reports: totalSources,
      dashboards: totalSources > 0 ? 1 : 0,
      account: "Active",
    },
    revenueForecast: 0,
    customerGrowth: totalRecords,
    operationalEfficiency,
    inventoryRisk,
    aiConfidence,
    recommendation: {
      priority: totalSources > 0 ? "High" : "Info",
      title: recommendationTitle,
      description: recommendationDescription,
      reason: recommendationReason,
      impact: recommendationImpact,
      modelStatus,
    },
    chart: [],
  };
}
