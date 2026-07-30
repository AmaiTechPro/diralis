import { ColumnProfile } from "../../types/profile";


function detectType(value: unknown):
"number" | "string" | "boolean" | "date" {

  if (typeof value === "number") {
    return "number";
  }


  if (typeof value === "boolean") {
    return "boolean";
  }


  if (typeof value === "string") {

    const date = Date.parse(value);

    if (!isNaN(date)) {
      return "date";
    }

    return "string";
  }


  return "string";
}


export function detectColumns(
  rows: Record<string, unknown>[]
): ColumnProfile[] {


  if (!rows.length) {
    return [];
  }


  const columns = Object.keys(rows[0]);


  return columns.map((column) => {


    const values = rows.map(
      row => row[column]
    );


    const firstValidValue =
      values.find(
        value => value !== null &&
                 value !== undefined &&
                 value !== ""
      );


    const type = detectType(firstValidValue);


    const uniqueValues =
      new Set(
        values.filter(
          value =>
            value !== null &&
            value !== undefined
        )
      );


    const missing =
      values.filter(
        value =>
          value === null ||
          value === undefined ||
          value === ""
      ).length;



    return {

      name: column,

      type,

      missing,

      unique: uniqueValues.size

    };

  });

}

