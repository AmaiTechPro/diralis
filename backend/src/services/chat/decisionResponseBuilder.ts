import { ChatContext } from "./chatContextBuilder";
import { ChatIntent } from "./chatIntentDetector";
import { generateBusinessRecommendations } from "./businessDecisionEngine";


export function buildDecisionResponse(
  intent: ChatIntent,
  context: ChatContext
): string {


  switch(intent){


    case "SUMMARY":

      return `
Executive Summary:

${context.executiveSummary}


Business Health:

${context.businessHealth}%


AI Score:

${context.aiScore}
`;



    case "HEALTH":

      return `
Business Health Analysis:

Current Score:
${context.businessHealth}%


AI Rating:
${context.aiScore}


Diralis Recommendation:

Continue monitoring business KPIs and improve data collection for deeper analysis.
`;



    case "INSIGHTS":

      return `
AI Insights:

${context.insights
.map(item => `• ${item}`)
.join("\n")}
`;



    case "WARNINGS":

      return `
Business Risks & Warnings:

${
context.warnings.length
?
context.warnings
.map(item => `• ${item}`)
.join("\n")
:
"No significant risks detected."
}
`;



    case "RECOMMENDATIONS":


      const recommendations =
        generateBusinessRecommendations(
          context
        );


      return `
Priority Recommendations:


${recommendations
.map(item => `• ${item}`)
.join("\n")}


Expected Outcome:

Better operational decisions, improved forecasting and stronger business performance.
`;



    case "QUALITY":

      return `
Data Quality Review:


Dataset:

${context.datasetName}


Records:

${context.rows}


Columns:

${context.columns}


Recommendation:

Maintain clean and complete data to improve AI accuracy.
`;



    case "FORECAST":

      return `
Forecasting Readiness:


Current Dataset:

${context.rows} records


Diralis Analysis:

${
context.rows < 1000
?
"More historical data is recommended before reliable forecasting."
:
"The dataset size is suitable for predictive analysis."
}

`;



    default:


      return `
I analyzed your dataset and can help with:


• Business performance
• Customer insights
• Risks
• Recommendations
• Forecasting opportunities


Ask me a business question and I'll analyze it.
`;

  }

}

