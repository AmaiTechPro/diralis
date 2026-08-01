import { DatasetProfile } from "../../types/profile";


export interface ReportData {

  title: string;

  generatedAt: string;


  summary: string;



  dataset?: {

    name: string;

    rows: number;

    columns: number;

  };



  businessHealth: number;


  qualityIssues: string[];



  aiScore: string;



  insights: string[];


  warnings: string[];



  recommendations: string[];

}



interface GeneratedInsights {

  summary: string;

  quality: string[];

  anomalies: string[];

  business: string[];

  forecast: string[];

  kpis: string[];

  rootCauses: string[];

}



export function generateReport(
  profile: DatasetProfile,
  insights: GeneratedInsights,
  datasetName = "Uploaded Dataset"
): ReportData {


  const score =
    profile.quality.score;



  return {

    title:
      "Diralis Executive Business Report",



    generatedAt:
      new Date().toISOString(),



    summary:
      insights.summary,



    dataset: {

      name:
        datasetName,

      rows:
        profile.rows,

      columns:
        profile.columns,

    },



    businessHealth:
      score,



    qualityIssues:
      profile.quality.issues ?? [],



    aiScore:
      score >= 90
        ? "A+"
        : score >= 80
        ? "A"
        : score >= 70
        ? "B"
        : "C",



    insights: [

      ...insights.business,

      ...insights.forecast,

      ...insights.kpis,

    ],



    warnings: [

      ...insights.quality,

      ...insights.anomalies,

      ...insights.rootCauses,

    ],



    recommendations: [

      "Improve datasets containing missing values.",

      "Monitor KPI performance regularly.",

      "Review detected anomalies.",

      "Use forecasting for future planning.",

    ],

  };

}

