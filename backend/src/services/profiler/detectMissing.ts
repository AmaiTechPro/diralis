export function detectMissing(
  rows: Record<string, unknown>[]
): Record<string, number> {


  if (!rows.length) {
    return {};
  }


  const columns = Object.keys(rows[0]);


  const missingValues: Record<string, number> = {};



  columns.forEach((column) => {


    const missingCount =
      rows.filter((row) => {

        const value = row[column];


        return (
          value === null ||
          value === undefined ||
          value === ""
        );

      }).length;



    missingValues[column] = missingCount;


  });



  return missingValues;

}


