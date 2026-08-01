import { TrendResult }
from "./trendIntelligence";


export interface PredictionContext {

  datasetName:string;

  rows:number;

  targetColumn?:string;

  timeColumn?:string;

  confidence:string;

  forecastPossible:boolean;

  trend?:TrendResult;

}

