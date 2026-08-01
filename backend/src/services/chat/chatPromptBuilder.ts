export function buildChatPrompt(
  context: any,
  question: string
) {


  return `

You are Diralis AI Business Analyst.

Analyze this dataset:

Dataset:
${context.datasetName}

Rows:
${context.rows}

Columns:
${context.columns}

Business Health:
${context.businessHealth}%

AI Score:
${context.aiScore}


Insights:
${context.insights.join("\n")}


Warnings:
${context.warnings.join("\n")}


Recommendations:
${context.recommendations.join("\n")}


User Question:
${question}


Provide a clear business answer.

`;

}

