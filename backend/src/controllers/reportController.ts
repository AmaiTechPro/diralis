import { Request, Response } from "express";

import { profileDataset } from "../services/profiler/profileDataset";

import { generateInsights } from "../services/insights/generateInsights";

import { parseDataset } from "../services/datasetFileService";

import {
  generateReport,
} from "../services/report/reportGenerator";

import {
  generatePDFReport,
} from "../services/report/pdfReportGenerator";

import {
  generateSectionReport,
} from "../services/report/reportSectionGenerator";

import {
  getLatestDataset,
} from "../services/datasetService";




async function buildReport(
  datasetId: string
) {

  if (!datasetId) {

    throw new Error(
      "Dataset ID is required"
    );

  }


  const rows =
    await parseDataset(
      datasetId
    );


  const profile =
    profileDataset(
      rows
    );


  const insights =
    generateInsights(
      profile
    );


  return generateReport(
    profile,
    insights
  );

}






async function resolveDatasetId(
  req: Request
) {


  const queryDatasetId =
    req.query.datasetId as string;



  if (queryDatasetId) {

    return queryDatasetId;

  }




  const userId =
    req.user?.userId;



  if (!userId) {

    throw new Error(
      "User authentication required"
    );

  }




  const latestDataset =
    await getLatestDataset(
      userId
    );



  if (!latestDataset) {

    throw new Error(
      "No datasets found"
    );

  }



  return latestDataset.id;

}







export async function reportController(
  req: Request,
  res: Response
) {

  try {


    const datasetId =
      await resolveDatasetId(
        req
      );



    const report =
      await buildReport(
        datasetId
      );



    res.json(
      report
    );


  } catch(error) {


    console.error(
      error
    );


    res.status(500).json({

      message:
        "Failed to generate report",

    });

  }

}




export async function generateReportPDF(
  req: Request,
  res: Response
) {

  try {


    const datasetId =
      await resolveDatasetId(
        req
      );



    const report =
      await buildReport(
        datasetId
      );



    const pdf =
      generatePDFReport(
        report
      );



    res.setHeader(
      "Content-Type",
      "application/pdf"
    );


    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Diralis_Full_Report.pdf"
    );



    pdf.pipe(
      res
    );



  } catch (error) {

  console.error(error);

  if (
    error instanceof Error &&
    error.message === "No datasets found"
  ) {
    return res.status(404).json({
      message:
        "No valid datasets found. Please upload a dataset to generate reports.",
    });
  }

  res.status(500).json({
    message: "Failed to generate report",
  });

  }
}



export async function generateSectionReportPDF(
  req: Request,
  res: Response
) {


  try {


    const section =
      String(
        req.params.section
      );



    const allowedSections = [

      "full",

      "executive",

      "health",

      "ai-score",

      "insights",

      "warnings",

      "recommendations",

    ];



    if(
      !allowedSections.includes(
        section
      )
    ) {


      return res.status(400).json({

        message:
          "Invalid report section",

      });

    }




    const datasetId =
      await resolveDatasetId(
        req
      );



    const report =
      await buildReport(
        datasetId
      );



    const sectionReport =
      generateSectionReport(
        section,
        report
      );



    const pdf =
      generatePDFReport(
        sectionReport
      );



    res.setHeader(
      "Content-Type",
      "application/pdf"
    );



    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Diralis_${section}_Report.pdf`
    );



    pdf.pipe(
      res
    );



  } catch(error) {


    console.error(
      "Section report generation failed:",
      error
    );



    res.status(500).json({

      message:
        "Failed to generate section report",

    });


  }

}

