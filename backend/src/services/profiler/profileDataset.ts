import { DatasetProfile } from "../../types/profile";

import { detectColumns } from "./detectColumns";
import { detectMissing } from "./detectMissing";
import { detectDuplicates } from "./detectDuplicates";
import { detectStatistics } from "./detectStatistics";
import { recommendCharts } from "./recommendCharts";

import { calculateQualityScore } 
from "./calculateQualityScore";

import { detectCorrelations } from "./detectCorrelations";


export function profileDataset(
  rows: Record<string, unknown>[]
): DatasetProfile {


  const columnProfiles =
    detectColumns(rows);



  const missingValues =
    detectMissing(rows);



  const duplicateRows =
    detectDuplicates(rows);



  const statistics =
    detectStatistics(rows);



  const recommendedCharts =
    recommendCharts(columnProfiles);


  const quality =
calculateQualityScore(
  rows.length,
  missingValues,
  duplicateRows
);

const correlations =
  detectCorrelations(rows);


  return {

    quality,

    rows: rows.length,

    columns:
      columnProfiles.length,


    columnProfiles,


    numericColumns:
      columnProfiles
        .filter(
          column =>
            column.type === "number"
        )
        .map(
          column =>
            column.name
        ),



    categoricalColumns:
      columnProfiles
        .filter(
          column =>
            column.type === "string"
        )
        .map(
          column =>
            column.name
        ),



    dateColumns:
      columnProfiles
        .filter(
          column =>
            column.type === "date"
        )
        .map(
          column =>
            column.name
        ),



    missingValues,


    duplicateRows,


    statistics,

   correlations,


    recommendedCharts

  };

}

