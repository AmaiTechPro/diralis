import { Request, Response } from "express";

import { generateReport } from "../services/report/reportGenerator";
import { generatePDFReport } from "../services/report/pdfReportGenerator";
import { generateSectionReport } from "../services/report/reportSectionGenerator";



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


  pdf.pipe(res);

}





export function generateSectionReportPDF(
  req: Request,
  res: Response
) {

  try {

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
        message:
          "Invalid report section",
      });

    }



    const sectionReport =
      generateSectionReport(
        section
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


    pdf.pipe(res);



  } catch (error) {

    console.error(
      "Section report generation failed:",
      error
    );


    return res.status(500).json({
      message:
        "Failed to generate section report",
    });

  }

}

