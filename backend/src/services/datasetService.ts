import prisma from "../lib/prisma";
import fs from "fs/promises";
import path from "path";


export async function getDatasets(
  userId: string
) {

  return prisma.dataset.findMany({

    where: {
      userId,
    },

    orderBy: {
      uploadedAt: "desc",
    },

  });

}


export async function getLatestDataset(
  userId: string
) {

  const datasets =
    await prisma.dataset.findMany({

      where: {
        userId,
      },

      orderBy: {
        uploadedAt: "desc",
      },

    });

  for (const dataset of datasets) {

    const filePath = path.join(
      process.cwd(),
      "uploads",
      dataset.filename
    );

    try {

      await fs.access(filePath);

      return dataset;

    } catch {

      console.warn(
        `Skipping missing dataset: ${dataset.originalName}`
      );

    }

  }

  return null;

}


export async function deleteDataset(
  id: string,
  userId: string
) {

  const dataset =
    await prisma.dataset.findFirst({

      where: {
        id,
        userId,
      },

    });



  if (!dataset) {

    throw new Error(
      "Dataset not found."
    );

  }



  const filePath =
    path.join(
      process.cwd(),
      "uploads",
      dataset.filename
    );



  try {

    await fs.unlink(
      filePath
    );

  } catch {

    console.warn(
      "Uploaded file was already missing."
    );

  }



  await prisma.dataset.delete({

    where: {
      id: dataset.id,
    },

  });



  return dataset;

}

