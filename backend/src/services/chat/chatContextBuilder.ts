import prisma from "../../lib/prisma";
import { getLatestDataset } from "../datasetService";
import { parseDataset } from "../datasetFileService";
import { profileDataset } from "../profiler/profileDataset";
import { generateInsights } from "../insights/generateInsights";
import { generateReport } from "../report/reportGenerator";
import { getCanonicalDatasetRows } from "../canonicalDataService";

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

  // 1. If uploaded dataset exists, use it
  if (dataset) {
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
        rows: profile.rows || profile.rowCount || 0,
        columns: profile.columns || profile.columnCount || 0,
        numericColumns: profile.numericColumns || [],
        dateColumns: profile.dateColumns || [],
        businessHealth: profile.businessHealth ?? quality,
        aiScore,
        executiveSummary: profile.executiveSummary || "Analysis completed for this dataset.",
        insights: profile.insights || [],
        warnings: profile.warnings || profile.quality?.issues || [],
        recommendations: profile.recommendations || [],
        qualityScore: quality,
        qualityIssues: profile.quality?.issues || [],
        missingValues: profile.missingValues || {},
        duplicateRows: profile.duplicateRows || 0,
      };
    }

    const rows = await parseDataset(dataset.id);
    const profile = profileDataset(rows);
    const insights = generateInsights(profile);
    const report = await generateReport(profile, insights, dataset.originalName);

    return {
      datasetName: dataset.originalName,
      rows: profile.rows,
      columns: profile.columns,
      numericColumns: profile.numericColumns,
      dateColumns: profile.dateColumns,
      businessHealth: report.businessHealth,
      aiScore: report.aiScore,
      executiveSummary: report.executiveSummary,
      insights: report.insights,
      warnings: report.warnings,
      recommendations: report.recommendations,
      qualityScore: profile.quality.score,
      qualityIssues: profile.quality.issues,
      missingValues: profile.missingValues,
      duplicateRows: profile.duplicateRows,
    };
  }

  // 2. Fallback to connected Shopify / Canonical data
  const canonical = await getCanonicalDatasetRows(userId);
  if (canonical && canonical.rows.length > 0) {
    const profile = profileDataset(canonical.rows);
    const insights = generateInsights(profile);
    const report = await generateReport(profile, insights, canonical.sourceName);

    return {
      datasetName: canonical.sourceName,
      rows: profile.rows,
      columns: profile.columns,
      numericColumns: profile.numericColumns,
      dateColumns: profile.dateColumns,
      businessHealth: report.businessHealth,
      aiScore: report.aiScore,
      executiveSummary: report.executiveSummary,
      insights: report.insights,
      warnings: report.warnings,
      recommendations: report.recommendations,
      qualityScore: profile.quality.score,
      qualityIssues: profile.quality.issues,
      missingValues: profile.missingValues,
      duplicateRows: profile.duplicateRows,
    };
  }

  throw new Error("No dataset or connected store available. Please upload a dataset or connect your store first.");
}


