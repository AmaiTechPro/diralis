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
  // If not cached, compute and persist to avoid future disk parsing
  const rawDataset = dataset as any;

  if (rawDataset.profileData) {
    const profile = typeof rawDataset.profileData === "string"
      ? JSON.parse(rawDataset.profileData)
      : rawDataset.profileData;

    return {
      datasetName: dataset.originalName,
      rows: profile.rows || 0,
      columns: profile.columns || 0,
      numericColumns: profile.numericColumns || [],
      dateColumns: profile.dateColumns || [],
      businessHealth: profile.businessHealth ?? 80,
      aiScore: profile.aiScore || "OPTIMAL",
      executiveSummary: profile.executiveSummary || "",
      insights: profile.insights || [],
      warnings: profile.warnings || [],
      recommendations: profile.recommendations || [],
      qualityScore: profile.qualityScore ?? 100,
      qualityIssues: profile.qualityIssues || [],
      missingValues: profile.missingValues || {},
      duplicateRows: profile.duplicateRows || 0,
    };
  }

  // Fallback: Compute on demand once if not yet cached
  const rows = await parseDataset(dataset.id);
  const profile = profileDataset(rows);
  const insights = generateInsights(profile);
  const report = generateReport(profile, insights);

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

