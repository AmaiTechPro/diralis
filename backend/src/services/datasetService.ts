import prisma from "../lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function getDatasets() {
  return prisma.dataset.findMany({
    orderBy: {
      uploadedAt: "desc",
    },
  });
}

export async function deleteDataset(id: string) {
  const dataset = await prisma.dataset.findUnique({
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

  try {
    await fs.unlink(filePath);
  } catch {
    console.warn(
      "Uploaded file was already missing."
    );
  }

  await prisma.dataset.delete({
    where: {
      id,
    },
  });

  return dataset;
}

