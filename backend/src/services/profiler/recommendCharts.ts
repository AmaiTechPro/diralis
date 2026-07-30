import { ColumnProfile } from "../../types/profile";


export function recommendCharts(
  columns: ColumnProfile[]
): string[] {


  const recommendations:string[] = [];



  const numericColumns =
    columns.filter(
      column =>
        column.type === "number"
    );



  const categoricalColumns =
    columns.filter(
      column =>
        column.type === "string"
    );



  const dateColumns =
    columns.filter(
      column =>
        column.type === "date"
    );



  /*
    Numeric Data
  */

  if (numericColumns.length > 0) {

    recommendations.push(
      "Histogram"
    );

    recommendations.push(
      "Box Plot"
    );

  }



  /*
    Category Data
  */

  if (categoricalColumns.length > 0) {

    recommendations.push(
      "Bar Chart"
    );


    if(categoricalColumns.length > 1){

      recommendations.push(
        "Pie Chart"
      );

    }

  }




  /*
    Date Data
  */

  if(dateColumns.length > 0){

    recommendations.push(
      "Line Chart"
    );

  }



  return recommendations;

}

