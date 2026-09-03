import { ReportData } from "./reportGenerator";

export function buildExecutiveReport(report: ReportData) {
  return {
    title: "Diralis Executive Summary Report",
    generatedAt: report.generatedAt,
    dataset: report.dataset,
    executiveSummary: report.executiveSummary,
    summary: report.summary,
    businessHealth: report.businessHealth,
    aiScore: report.aiScore,
  };
}

export function buildHealthReport(report: ReportData) {
  return {
    title: "Diralis Business Health Report",
    generatedAt: report.generatedAt,
    dataset: report.dataset,
    businessHealth: report.businessHealth,
    qualityIssues: report.qualityIssues,
  };
}

export function buildAIScoreReport(report: ReportData) {
  return {
    title: "Diralis AI Score Report",
    generatedAt: report.generatedAt,
    dataset: report.dataset,
    aiScore: report.aiScore,
    businessHealth: report.businessHealth,
  };
}

export function buildInsightsReport(report: ReportData) {
  return {
    title: "Diralis AI Insights Report",
    generatedAt: report.generatedAt,
    dataset: report.dataset,
    insights: report.insights,
  };
}

export function buildWarningsReport(report: ReportData) {
  return {
    title: "Diralis Warnings Report",
    generatedAt: report.generatedAt,
    dataset: report.dataset,
    warnings: report.warnings,
  };
}

export function buildRecommendationsReport(report: ReportData) {
  return {
    title: "Diralis Recommendations Report",
    generatedAt: report.generatedAt,
    dataset: report.dataset,
    recommendations: report.recommendations,
  };
}


