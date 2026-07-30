import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { previewDataset } from "../services/previewService";


interface DatasetParams {
  id: string;
}

import {
  getDatasets as getDatasetsService,
  deleteDataset as deleteDatasetService,
} from "../services/datasetService";

export async function uploadDataset(
  req: Request,
  res: Response
) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded.",
      });
    }

    const dataset =
      await prisma.dataset.create({
        data: {
          originalName:
            req.file.originalname,

          filename:
            req.file.filename,

          size:
            req.file.size,

          mimetype:
            req.file.mimetype,
        },
      });

    return res.status(201).json({
      message:
        "Dataset uploaded successfully.",
      dataset,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        "Failed to upload dataset.",
    });
  }
}

export async function getDatasets(
  req: Request,
  res: Response
) {
  try {
    const datasets =
      await getDatasetsService();

    return res.json(datasets);

  } catch (error) {
    return res.status(500).json({
      error:
        "Failed to retrieve datasets.",
    });
  }
}

export async function deleteDataset(
  req: Request<DatasetParams>,
  res: Response
)

{
  try {
    await deleteDatasetService(
      req.params.id
    );

    return res.json({
      message:
        "Dataset deleted successfully.",
    });

  } catch (error) {
    return res.status(404).json({
      error:
        (error as Error).message,
    });
  }
}


export async function previewDatasetController(
  req: Request<DatasetParams>,
  res: Response
) {
  try {
    const preview =
      await previewDataset(req.params.id);

    return res.json(preview);

  } catch (error) {

    return res.status(400).json({
      error:
        (error as Error).message,
    });

  }
}


