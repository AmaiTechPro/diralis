export function detectDuplicates(
  rows: Record<string, unknown>[]
): number {


  if (!rows.length) {
    return 0;
  }


  const uniqueRows = new Set(
    rows.map(row =>
      JSON.stringify(row)
    )
  );


  return rows.length - uniqueRows.size;

}


