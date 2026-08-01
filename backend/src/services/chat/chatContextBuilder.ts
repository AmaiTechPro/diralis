import { parseDataset } from "../datasetFileService";

import { profileDataset } from "../profiler/profileDataset";

import { generateInsights } from "../insights/generateInsights";

import { generateReport } from "../report/reportGenerator";

import { getLatestDataset } from "../datasetService";



export interface ChatContext {

  datasetName: string;

  rows: number;

  columns: number;


  numericColumns: string[];

  dateColumns: string[];


  businessHealth: number;

  aiScore: string;


  executiveSummary: string;


  insights: string[];

  warnings: string[];

  recommendations: string[];


  qualityScore: number;

  qualityIssues: string[];


  missingValues: Record<string, number>;

  duplicateRows: number;

}




export async function buildChatContext(
  userId: string
): Promise<ChatContext> {


  const dataset =
    await getLatestDataset(
      userId
    );



  if (!dataset) {

    throw new Error(
      "No dataset available"
    );

  }



  const rows =
    await parseDataset(
      dataset.id
    );



  const profile =
    profileDataset(
      rows
    );



  const insights =
    generateInsights(
      profile
    );



  const report =
    generateReport(
      profile,
      insights
    );



  return {

  datasetName:
    dataset.originalName,


  rows:
    profile.rows,


  numericColumns:
  profile.numericColumns,


dateColumns:
  profile.dateColumns,


  columns:
    profile.columns,


  businessHealth:
    report.businessHealth,


  aiScore:
    report.aiScore,


  executiveSummary:
    report.executiveSummary,


  insights:
    report.insights ?? [],


  warnings:
    report.warnings ?? [],


  recommendations:
    report.recommendations ?? [],


  qualityScore:
    profile.quality.score,


  qualityIssues:
    profile.quality.issues ?? [],


  missingValues:
    profile.missingValues,


  duplicateRows:
    profile.duplicateRows,

};

}

