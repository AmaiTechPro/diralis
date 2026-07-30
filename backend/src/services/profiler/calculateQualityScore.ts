import { DataQualityReport } from "../../types/profile";


export function calculateQualityScore(
  rows:number,
  missingValues:Record<string,number>,
  duplicateRows:number
):DataQualityReport {


  let score = 100;


  const issues:string[] = [];



  /*
    Missing Values
  */

  const totalMissing =
    Object.values(missingValues)
    .reduce(
      (sum,value)=>sum + value,
      0
    );



  if(totalMissing > 0){

    score -= 10;


    issues.push(
      "Missing values detected"
    );

  }




  /*
    Duplicate Records
  */

  if(duplicateRows > 0){

    score -= 10;


    issues.push(
      "Duplicate records detected"
    );

  }




  /*
    Empty Dataset Protection
  */

  if(rows === 0){

    score = 0;


    issues.push(
      "Dataset is empty"
    );

  }




  return {

    score:
      Math.max(score,0),


    issues

  };

}

