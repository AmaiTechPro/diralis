import PDFDocument from "pdfkit";


export function generatePDFReport(
  report: any
) {

  const doc =
    new PDFDocument();



  doc
    .fontSize(20)
    .text(
      report.title ||
      "Diralis Business Report",
      {
        align: "center",
      }
    );


  doc.moveDown();



  doc
    .fontSize(10)
    .text(
      `Generated: ${
        report.generated ||
        new Date().toISOString()
      }`
    );


  doc.moveDown();



  /*
    Executive Summary
  */

  if (report.summary) {

    doc
      .fontSize(15)
      .text(
        "Executive Summary"
      );


    doc
      .fontSize(11)
      .text(
        report.summary
      );


    doc.moveDown();

  }




  /*
    Business Health
  */

  if (report.businessHealth) {

    doc
      .fontSize(15)
      .text(
        "Business Health"
      );


    doc
      .fontSize(11)
      .text(
        `Health Score: ${report.businessHealth}%`
      );


    doc.moveDown();

  }




  /*
    AI Score
  */

  if (report.aiScore) {

    doc
      .fontSize(15)
      .text(
        "AI Score"
      );


    doc
      .fontSize(11)
      .text(
        `AI Score: ${report.aiScore}`
      );


    doc.moveDown();

  }




  /*
    Insights
  */

  if (report.insights) {

    doc
      .fontSize(15)
      .text(
        "AI Insights"
      );


    if (Array.isArray(report.insights)) {

      report.insights.forEach(
        (item: string, index: number) => {

          doc.text(
            `${index + 1}. ${item}`
          );

        }
      );

    } else {

      doc.text(
        String(report.insights)
      );

    }


    doc.moveDown();

  }




  /*
    Warnings
  */

  if (report.warnings) {

    doc
      .fontSize(15)
      .text(
        "Warnings"
      );


    if (Array.isArray(report.warnings)) {

      report.warnings.forEach(
        (item: string, index: number) => {

          doc.text(
            `${index + 1}. ${item}`
          );

        }
      );

    } else {

      doc.text(
        String(report.warnings)
      );

    }


    doc.moveDown();

  }




  /*
    Recommendations
  */

  if (report.recommendations) {

    doc
      .fontSize(15)
      .text(
        "Recommendations"
      );


    if (Array.isArray(report.recommendations)) {

      report.recommendations.forEach(
        (item: string, index: number) => {

          doc.text(
            `${index + 1}. ${item}`
          );

        }
      );

    } else {

      doc.text(
        String(report.recommendations)
      );

    }


  }



  doc.end();


  return doc;

}

