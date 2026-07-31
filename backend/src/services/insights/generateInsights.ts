import { DatasetProfile } from "../../types/profile";

import { generateSummaryInsight } from "./summaryInsight";
import { generateQualityInsights } from "./qualityInsight";
import { generateStatisticsInsight } from "./statisticsInsight";
import { generateBusinessInsights } from "./businessInsight";
import { generateTrendForecast } from "../predictions/trendForecast";
import { generateAnomalyInsights } from "./anomalyInsight";
import { generateCorrelationInsights } from "./correlationInsight";

import { generateKpiInsights } from "./kpiInsight";
import { generateRootCauseInsights } from "./rootCauseInsight";


export function generateInsights(profile: DatasetProfile) {
  return {

    summary: generateSummaryInsight(
      profile.rows,
      profile.columns,
      profile.quality.score
    ),

    quality: generateQualityInsights(
      profile.quality.issues ?? [],
      profile.missingValues,
      profile.duplicateRows
    ),

    statistics: generateStatisticsInsight(
      profile.statistics
    ),

    anomalies: generateAnomalyInsights(
      profile.statistics
    ),

    correlations: generateCorrelationInsights(
      profile.correlations
    ),

    business: generateBusinessInsights(
      profile
    ),

    forecast: generateTrendForecast(
      profile.rows,
      profile.numericColumns,
      profile.dateColumns,
      profile.statistics
    ),

  kpis: generateKpiInsights(
  profile.statistics,
  profile.correlations
),

rootCauses: generateRootCauseInsights(
  profile.correlations
),

  };
}