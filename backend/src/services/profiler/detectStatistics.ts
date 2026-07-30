import { NumericStatistics } from "../../types/profile";


function calculateMean(values: number[]): number {

  const total =
    values.reduce(
      (sum, value) => sum + value,
      0
    );


  return total / values.length;

}



function calculateMedian(values: number[]): number {

  const sorted =
    [...values].sort(
      (a, b) => a - b
    );


  const middle =
    Math.floor(sorted.length / 2);



  if (sorted.length % 2 === 0) {

    return (
      (sorted[middle - 1] +
       sorted[middle]) / 2
    );

  }


  return sorted[middle];

}



function calculateStandardDeviation(
  values:number[],
  mean:number
):number {


  const variance =
    values.reduce(
      (sum,value)=>{

        return (
          sum +
          Math.pow(
            value - mean,
            2
          )
        );

      },
      0
    ) / values.length;



  return Math.sqrt(variance);

}




export function detectStatistics(
  rows: Record<string, unknown>[]
): Record<string, NumericStatistics> {


  if (!rows.length) {
    return {};
  }


  const statistics:
  Record<string, NumericStatistics> = {};



  const columns =
    Object.keys(rows[0]);



  columns.forEach((column)=>{


    const numbers =
      rows
      .map(row => row[column])
      .filter(
        value =>
          typeof value === "number"
      ) as number[];



    if (!numbers.length) {
      return;
    }



    const mean =
      calculateMean(numbers);



    statistics[column] = {

      min:
        Math.min(...numbers),

      max:
        Math.max(...numbers),

      mean,

      median:
        calculateMedian(numbers),

      standardDeviation:
        calculateStandardDeviation(
          numbers,
          mean
        )

    };


  });



  return statistics;

}

