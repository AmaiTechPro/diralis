import prisma from "../../lib/prisma";
import { getLatestDataset } from "../datasetService";
import { parseDataset } from "../datasetFileService";
import { profileDataset } from "../profiler/profileDataset";
import { generateInsights } from "../insights/generateInsights";
import { generateReport } from "../report/reportGenerator";

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

export async function buildChatContext(userId: string): Promise<ChatContext> {
  const dataset = await getLatestDataset(userId);

  if (!dataset) {
    throw new Error("No dataset available. Please upload a dataset first.");
  }

  // Check if profile/summary is already persisted on the dataset model
  const rawDataset = dataset as any;

  if (rawDataset.profileData) {
    const profile =
      typeof rawDataset.profileData === "string"
        ? JSON.parse(rawDataset.profileData)
        : rawDataset.profileData;

    const quality = profile.qualityScore ?? profile.quality?.score ?? 0;
    let aiScore = profile.aiScore;
    if (!aiScore) {
      if (quality >= 90) aiScore = "A+";
      else if (quality >= 80) aiScore = "A";
      else if (quality >= 70) aiScore = "B";
      else aiScore = "C";
    }

    return {
      datasetName: dataset.originalName,
      rows: profile.rows || 0,
      columns: profile.columns || 0,
      numericColumns: profile.numericColumns || [],
      dateColumns: profile.dateColumns || [],
      businessHealth: profile.businessHealth ?? quality,
      aiScore,
      executiveSummary:
        profile.executiveSummary ||
        `Dataset '${dataset.originalName}' contains ${profile.rows || 0} rows and ${profile.columns || 0} columns with an overall quality score of ${quality}%.`,
      insights: profile.insights || [],
      warnings: profile.warnings || profile.qualityIssues || [],
      recommendations: profile.recommendations || [],
      qualityScore: quality,
      qualityIssues: profile.qualityIssues || profile.quality?.issues || [],
      missingValues: profile.missingValues || {},
      duplicateRows: profile.duplicateRows || 0,
    };
  }

  // Compute on demand and await grounded report generation
  const rows = await parseDataset(dataset.id);
  const profile = profileDataset(rows);
  const insights = generateInsights(profile);
  const report = await generateReport(profile, insights, dataset.originalName);

  const context: ChatContext = {
    datasetName: dataset.originalName,
    rows: profile.rows,
    numericColumns: profile.numericColumns,
    dateColumns: profile.dateColumns,
    columns: profile.columns,
    businessHealth: report.businessHealth,
    aiScore: report.aiScore,
    executiveSummary: report.executiveSummary,
    insights: report.insights ?? [],
    warnings: report.warnings ?? [],
    recommendations: report.recommendations ?? [],
    qualityScore: profile.quality.score,
    qualityIssues: profile.quality.issues ?? [],
    missingValues: profile.missingValues,
    duplicateRows: profile.duplicateRows,
  };

  return context;
}


