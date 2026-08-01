import { Request, Response } from "express";

import { generateReport } from "../services/report/reportGenerator";
import { generatePDFReport } from "../services/report/pdfReportGenerator";



export function reportController(
  req: Request,
  res: Response
) {

  res.json(
    generateReport()
  );

}




export function generateReportPDF(
  req: Request,
  res: Response
) {

  const report =
    generateReport();


  const pdf =
    generatePDFReport(report);



  res.setHeader(
    "Content-Type",
    "application/pdf"
  );


  res.setHeader(
    "Content-Disposition",
    "attachment; filename=Diralis_Full_Report.pdf"
  );


  pdf.pipe(res);

}




export function generateSectionReportPDF(
  req: Request,
  res: Response
) {

  const section =
    String(req.params.section);


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



  const report =
    generateReport();



  let sectionReport;



  switch (section) {


    case "executive":

      sectionReport = {

        title:
          "Diralis Executive Summary Report",

        generatedAt:
          report.generatedAt,

        summary:
          report.summary,

        businessHealth:
          report.businessHealth,

        aiScore:
          report.aiScore,

      };

      break;



    case "health":

      sectionReport = {

        title:
          "Diralis Business Health Report",

        generatedAt:
          report.generatedAt,

        businessHealth:
          report.businessHealth,

      };

      break;



    case "ai-score":

      sectionReport = {

        title:
          "Diralis AI Score Report",

        generatedAt:
          report.generatedAt,

        aiScore:
          report.aiScore,

      };

      break;



    case "insights":

      sectionReport = {

        title:
          "Diralis AI Insights Report",

        generatedAt:
          report.generatedAt,

        insights:
          report.insights,

      };

      break;



    case "warnings":

      sectionReport = {

        title:
          "Diralis Data Warnings Report",

        generatedAt:
          report.generatedAt,

        warnings:
          report.warnings,

      };

      break;



    case "recommendations":

      sectionReport = {

        title:
          "Diralis Recommendations Report",

        generatedAt:
          report.generatedAt,

        recommendations:
          report.recommendations,

      };

      break;



    default:

      sectionReport =
        report;

      break;

  }



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


  pdf.pipe(res);

}



