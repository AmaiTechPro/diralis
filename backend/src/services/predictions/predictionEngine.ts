import { ChatContext }
from "../chat/chatContextBuilder";

import { buildPredictionContext }
from "./predictionContextBuilder";

import { extractNumericValues }
from "./valueExtractor";

import { analyzeTrend }
from "./trendIntelligence";

import { generateBusinessRecommendation }
from "./businessRecommendationEngine";

import { generateForecast }
from "./simpleForecast";


export interface PredictionResult {

  context: ReturnType<
    typeof buildPredictionContext
  >;

  trend?: ReturnType<
    typeof analyzeTrend
  >;

  recommendation?: ReturnType<
    typeof generateBusinessRecommendation
  >;

  forecast?: number[];

}



export function generatePredictionInsights(
  context: ChatContext,
  rows: Record<string, unknown>[]
): PredictionResult {


  const predictionContext =
    buildPredictionContext(
      context
    );


  let trend;

  let forecast:number[] = [];


  if(
    predictionContext.targetColumn
  ){

    const values =
      extractNumericValues(
        rows,
        predictionContext.targetColumn
      );

     forecast =
  generateForecast(
    values
  );


    trend =
      analyzeTrend(
        values
      );

  }


  return {

  context:
    predictionContext,

  trend,


  recommendation:
    generateBusinessRecommendation(
      trend
    ),

  forecast,

  

};

}

