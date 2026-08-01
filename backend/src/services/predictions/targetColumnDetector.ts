export interface TargetDetectionResult {

  targetColumn?: string;

  timeColumn?: string;

  confidence:
    | "HIGH"
    | "MEDIUM"
    | "LOW";

}



const metricKeywords = [

  "sales",
  "revenue",
  "income",
  "profit",
  "amount",
  "price",
  "value",
  "orders",
  "customers",
  "demand"

];


const timeKeywords = [

  "date",
  "time",
  "month",
  "year",
  "day",
  "period"

];



export function detectTargetColumn(
  columns:string[]
):TargetDetectionResult {


  let targetColumn:string | undefined;

  let timeColumn:string | undefined;



  for(
    const column of columns
  ){

    const normalized =
      column.toLowerCase();



    if(
      metricKeywords.some(
        keyword =>
          normalized.includes(keyword)
      )
    ){

      targetColumn =
        column;

    }



    if(
      timeKeywords.some(
        keyword =>
          normalized.includes(keyword)
      )
    ){

      timeColumn =
        column;

    }

  }



  let confidence:
    | "HIGH"
    | "MEDIUM"
    | "LOW";


  if(
    targetColumn &&
    timeColumn
  ){

    confidence = "HIGH";

  }
  else if(
    targetColumn
  ){

    confidence = "MEDIUM";

  }
  else {

    confidence = "LOW";

  }



  return {

    targetColumn,

    timeColumn,

    confidence

  };

}

