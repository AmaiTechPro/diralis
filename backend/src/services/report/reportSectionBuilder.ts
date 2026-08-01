import { ReportData } from "./reportGenerator";


export function buildExecutiveReport(
  report: ReportData
) {
  return {
    title: "Diralis Executive Summary Report",
    generatedAt: report.generatedAt,

    summary: report.summary,

    businessHealth:
      report.businessHealth,

    aiScore:
      report.aiScore,
  };
}



export function buildHealthReport(
  report: ReportData
) {
  return {
    title: "Diralis Business Health Report",

    generatedAt:
      report.generatedAt,

    businessHealth:
      report.businessHealth,
  };
}



export function buildAIScoreReport(
  report: ReportData
) {
  return {
    title: "Diralis AI Score Report",

    generatedAt:
      report.generatedAt,

    aiScore:
      report.aiScore,
  };
}



export function buildInsightsReport(
  report: ReportData
) {
  return {
    title: "Diralis AI Insights Report",

    generatedAt:
      report.generatedAt,

    insights:
      report.insights,
  };
}



export function buildWarningsReport(
  report: ReportData
) {
  return {
    title: "Diralis Warnings Report",

    generatedAt:
      report.generatedAt,

    warnings:
      report.warnings,
  };
}



export function buildRecommendationsReport(
  report: ReportData
) {
  return {
    title: "Diralis Recommendations Report",

    generatedAt:
      report.generatedAt,

    recommendations:
      report.recommendations,
  };
}

