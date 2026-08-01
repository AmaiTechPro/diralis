export interface ReportData {
  title: string;
  generatedAt: string;
  summary: string;
  businessHealth: number;
  aiScore: string;
  insights: number;
  warnings: number;
  recommendations: string[];
}

export function generateReport(): ReportData {
  return {
    title: "Diralis Executive Business Report",
    generatedAt: new Date().toISOString(),

    summary:
      "This report summarizes the overall health of your business datasets and highlights key AI findings.",

    businessHealth: 96,

    aiScore: "A+",

    insights: 12,

    warnings: 3,

    recommendations: [
      "Improve datasets containing missing values.",
      "Monitor KPI performance weekly.",
      "Adopt forecasting for historical datasets.",
      "Review detected anomalies regularly.",
    ],
  };
}

