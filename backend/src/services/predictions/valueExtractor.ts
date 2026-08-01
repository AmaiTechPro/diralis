export function extractNumericValues(
  rows: Record<string, unknown>[],
  column:string
):number[] {


  return rows

    .map(row =>
      Number(row[column])
    )

    .filter(
      value =>
        !Number.isNaN(value)
    );

}

