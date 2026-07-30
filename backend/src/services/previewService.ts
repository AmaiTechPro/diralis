import fs from "fs";
import path from "path";
import csv from "csv-parser";
import * as XLSX from "xlsx";

import prisma from "../lib/prisma";

import type { PreviewResult } from "../types/preview";

interface RawPreview {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export async function previewDataset(
  id: string
): Promise<PreviewResult> {
  const dataset =
    await prisma.dataset.findUnique({
      where: {
        id,
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

  let preview: RawPreview;

  if (extension === ".csv") {
    preview =
      await previewCSV(filePath);
  } else if (
    extension === ".xlsx" ||
    extension === ".xls"
  ) {
    preview =
      previewExcel(filePath);
  } else {
    throw new Error(
      "Unsupported dataset format."
    );
  }

  return {
    fileName: dataset.originalName,
    fileType: extension.replace(".", ""),
    fileSize: dataset.size,

    columns: preview.columns,
    rows: preview.rows,

    rowCount: preview.rowCount,
    columnCount:
      preview.columns.length,
  };
}

async function previewCSV(
  filePath: string
): Promise<RawPreview> {
  return new Promise((resolve, reject) => {
    const rows: Record<
      string,
      unknown
    >[] = [];

    let columns: string[] = [];

    let totalRows = 0;

    fs.createReadStream(filePath)
      .pipe(csv())

      .on("headers", (headers) => {
        columns = headers;
      })

      .on("data", (row) => {
        totalRows++;

        if (rows.length < 50) {
          rows.push(row);
        }
      })

      .on("end", () => {
        resolve({
          columns,
          rows,
          rowCount: totalRows,
        });
      })

      .on("error", reject);
  });
}

function previewExcel(
  filePath: string
): RawPreview {
  const workbook =
    XLSX.readFile(filePath);

  const sheet =
    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  const json =
    XLSX.utils.sheet_to_json<
      Record<string, unknown>
    >(sheet);

  return {
    columns:
      json.length > 0
        ? Object.keys(json[0])
        : [],

    rows:
      json.slice(0, 50),

    rowCount:
      json.length,
  };
}

