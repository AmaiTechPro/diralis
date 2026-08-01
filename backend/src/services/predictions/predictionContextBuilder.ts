import { ChatContext }
from "../chat/chatContextBuilder";

import { detectTargetColumn }
from "./targetColumnDetector";



export interface PredictionContext {

  datasetName:string;

  rows:number;

  targetColumn?:string;

  timeColumn?:string;

  confidence:string;

  forecastPossible:boolean;

}



export function buildPredictionContext(
  context:ChatContext
):PredictionContext {


  const columns = [

  ...(context.numericColumns ?? []),

  ...(context.dateColumns ?? [])

];



  const detection =
    detectTargetColumn(
      columns
    );



  return {


    datasetName:
      context.datasetName,


    rows:
      context.rows,


    targetColumn:
      detection.targetColumn,


    timeColumn:
      detection.timeColumn,


    confidence:
      detection.confidence,


    forecastPossible:
      Boolean(
        detection.targetColumn &&
        detection.timeColumn
      )


  };

}

