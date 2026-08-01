import { TrendResult }
from "./trendIntelligence";


export interface BusinessRecommendation {

  priority:
    | "HIGH"
    | "MEDIUM"
    | "LOW";

  recommendation:string;

  reason:string;

}



export function generateBusinessRecommendation(
  trend?:TrendResult
):BusinessRecommendation {


  if(!trend){

    return {

      priority:"LOW",

      recommendation:
        "Collect more historical data before making decisions.",

      reason:
        "Insufficient trend information."

    };

  }



  if(
    trend.direction === "GROWING" &&
    trend.momentum === "STRONG"
  ){

    return {

      priority:"HIGH",

      recommendation:
        "Consider increasing operational capacity and inventory planning.",

      reason:
        trend.signal

    };

  }



  if(
    trend.direction === "DECLINING"
  ){

    return {

      priority:"HIGH",

      recommendation:
        "Investigate declining performance and identify improvement opportunities.",

      reason:
        trend.signal

    };

  }



  return {

    priority:"MEDIUM",

    recommendation:
      "Monitor performance trends and maintain current strategy.",

    reason:
      trend.signal

  };

}

