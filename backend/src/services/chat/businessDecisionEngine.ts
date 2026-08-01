import { ChatContext } from "./chatContextBuilder";

import { generateForecast } from "../forecasting/forecastEngine";



export function generateBusinessRecommendations(
  context: ChatContext
): string[] {


  const recommendations: string[] = [];



  /*
   * Forecasting readiness analysis
   */
  const forecast =
    generateForecast(
      context
    );


  if(
    !forecast.available
  ){

    recommendations.push(
      "Improve forecasting readiness by adding historical business records with dates and measurable metrics."
    );

  }



  /*
   * Dataset size evaluation
   */
  if(
    context.rows < 1000
  ){

    recommendations.push(
      "Collect more historical records to improve forecasting accuracy."
    );

  }



  /*
   * Data quality evaluation
   */
  if(
    context.warnings.length > 0
  ){

    recommendations.push(
      "Resolve detected data quality issues before making strategic decisions."
    );

  }



  /*
   * Pattern discovery opportunities
   */
  if(
    context.insights.length > 0
  ){

    recommendations.push(
      "Analyze discovered patterns to identify customer and operational opportunities."
    );

  }



  /*
   * General business intelligence recommendations
   */
  recommendations.push(
    "Monitor important business KPIs regularly to track growth."
  );


  recommendations.push(
    "Use predictive analytics to identify future opportunities."
  );



  return recommendations;

}

