import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { profileDataset } from "../services/profiler/profileDataset";
import { generateInsights } from "../services/insights/generateInsights";
import { parseDataset } from "../services/datasetFileService";
import { generateReport } from "../services/report/reportGenerator";
import { generatePDFReport } from "../services/report/pdfReportGenerator";
import { generateSectionReport } from "../services/report/reportSectionGenerator";
import { getLatestDataset } from "../services/datasetService";

async function buildReport(datasetId: string, userId: string) {
  if (!datasetId) {
    throw new Error("Dataset ID is required");
  }

  // Tenant Isolation Check (Milestone 5.2, Section 32)
  const datasetRecord = await prisma.dataset.findFirst({
    where: {
      id: datasetId,
      userId,
    },
    select: {
      originalName: true,
    },
  });

  if (!datasetRecord) {
    throw new Error("Dataset not found or unauthorized");
  }

  const rows = await parseDataset(datasetId);
  const profile = profileDataset(rows);
  const insights = generateInsights(profile);

  // Await grounded AI report generation with real dataset provenance
  return await generateReport(profile, insights, datasetRecord.originalName);
}

async function resolveDatasetId(req: Request): Promise<{ datasetId: string; userId: string }> {
  const userId = req.user?.userId;
  if (!userId) {
    throw new Error("User authentication required");
  }

  const queryDatasetId = req.query.datasetId as string;
  if (queryDatasetId) {
    return { datasetId: queryDatasetId, userId };
  }

  const latestDataset = await getLatestDataset(userId);
  if (!latestDataset) {
    throw new Error("No datasets found");
  }

  return { datasetId: latestDataset.id, userId };
}

export async function reportController(req: Request, res: Response) {
  try {
    const { datasetId, userId } = await resolveDatasetId(req);
    const report = await buildReport(datasetId, userId);
    return res.json(report);
  } catch (error) {
    console.error("[reportController] Error:", error);
    if (error instanceof Error && error.message === "No datasets found") {
      return res.status(404).json({
        message: "No valid datasets found. Please upload a dataset to generate reports.",
      });
    }
    if (error instanceof Error && error.message === "Dataset not found or unauthorized") {
      return res.status(404).json({
        message: "Dataset not found or access denied.",
      });
    }
    return res.status(500).json({
      message: "Failed to generate report",
    });
  }
}

export async function generateReportPDF(req: Request, res: Response) {
  try {
    const { datasetId, userId } = await resolveDatasetId(req);
    const report = await buildReport(datasetId, userId);
    const pdf = generatePDFReport(report);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Diralis_Full_Report.pdf");

    pdf.pipe(res);
  } catch (error) {
    console.error("[generateReportPDF] Error:", error);
    if (error instanceof Error && error.message === "No datasets found") {
      return res.status(404).json({
        message: "No valid datasets found. Please upload a dataset to generate reports.",
      });
    }
    return res.status(500).json({
      message: "Failed to generate report",
    });
  }
}

export async function generateSectionReportPDF(req: Request, res: Response) {
  try {
    const section = String(req.params.section);
    const allowedSections = [
      "full",
      "executive",
      "health",
      "ai-score",
      "insights",
      "warnings",
      "recommendations",
    ];

    if (!allowedSections.includes(section)) {
      return res.status(400).json({
        message: "Invalid report section",
      });
    }

    const { datasetId, userId } = await resolveDatasetId(req);
    const report = await buildReport(datasetId, userId);
    const sectionReport = generateSectionReport(section, report);
    const pdf = generatePDFReport(sectionReport);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Diralis_${section}_Report.pdf`);

    pdf.pipe(res);
  } catch (error) {
    console.error("[generateSectionReportPDF] Error:", error);
    return res.status(500).json({
      message: "Failed to generate section report",
    });
  }
}


