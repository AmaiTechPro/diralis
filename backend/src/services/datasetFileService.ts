import fs from "fs";
import path from "path";
import csv from "csv-parser";
import * as XLSX from "xlsx";

import prisma from "../lib/prisma";

export async function parseDataset(
  datasetId: string
): Promise<Record<string, unknown>[]> {

  const dataset =
    await prisma.dataset.findUnique({
      where: {
        id: datasetId,
      },
    });

  if (!dataset) {
    throw new Error("Dataset not found.");
  }

  const filePath = path.join(
    process.cwd(),
    "uploads",
    dataset.filename
  );

  const extension =
    path.extname(filePath).toLowerCase();

  if (extension === ".csv") {
    return parseCSV(filePath);
  }

  if (
    extension === ".xlsx" ||
    extension === ".xls"
  ) {
    return parseExcel(filePath);
  }

  throw new Error(
    "Unsupported dataset format."
  );
}

async function parseCSV(
  filePath: string
): Promise<Record<string, unknown>[]> {

  return new Promise((resolve, reject) => {

    const rows: Record<
      string,
      unknown
    >[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())

      .on("data", (row) => {
        rows.push(row);
      })

      .on("end", () => {
        resolve(rows);
      })

      .on("error", reject);

  });

}

function parseExcel(
  filePath: string
): Record<string, unknown>[] {

  const workbook =
    XLSX.readFile(filePath);

  const sheet =
    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  return XLSX.utils.sheet_to_json<
    Record<string, unknown>
  >(sheet);

}

