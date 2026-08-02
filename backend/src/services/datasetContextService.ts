import fs from "fs/promises";
import path from "path";
import prisma from "../lib/prisma";

export async function getLatestDatasetContext() {
  const dataset = await prisma.dataset.findFirst({
    orderBy: {
      uploadedAt: "desc",
    },
  });

  if (!dataset) {
    return "No dataset has been uploaded.";
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "uploads",
      dataset.filename
    );

    const content = await fs.readFile(
      filePath,
      "utf-8"
    );

    return `
Latest Dataset

Name: ${dataset.originalName}

Rows Preview:

${content.substring(0, 6000)}
`;
  } catch {
    return `
Dataset metadata

Name: ${dataset.originalName}

File could not be read.
`;
  }
}

