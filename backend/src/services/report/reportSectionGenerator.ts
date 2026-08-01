import { generateReport } from "./reportGenerator";

import {
  buildExecutiveReport,
  buildHealthReport,
  buildAIScoreReport,
  buildInsightsReport,
  buildWarningsReport,
  buildRecommendationsReport,
} from "./reportSectionBuilder";


export function generateSectionReport(
  section: string
) {

  const report =
    generateReport();



  switch (section) {

    case "executive":

      return buildExecutiveReport(
        report
      );


    case "health":

      return buildHealthReport(
        report
      );


    case "ai-score":

      return buildAIScoreReport(
        report
      );


    case "insights":

      return buildInsightsReport(
        report
      );


    case "warnings":

      return buildWarningsReport(
        report
      );


    case "recommendations":

      return buildRecommendationsReport(
        report
      );


    case "full":

      return report;


    default:

      throw new Error(
        "Invalid report section"
      );

  }

}

