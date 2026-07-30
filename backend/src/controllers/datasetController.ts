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

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized.",
      });
    }

    const dataset =
      await prisma.dataset.create({
        data: {
          originalName: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          userId: req.user.userId,
        },
      });

    return res.status(201).json({
      message: "Dataset uploaded successfully.",
      dataset,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to upload dataset.",
    });
  }
}

export async function getDatasets(
  req: Request,
  res: Response
) {
  try {

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized.",
      });
    }

    const datasets =
      await getDatasetsService(
        req.user.userId
      );

    return res.json(datasets);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        "Failed to retrieve datasets.",
    });

  }
}

export async function deleteDataset(
  req: Request<DatasetParams>,
  res: Response
) {
  try {

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized.",
      });
    }

    await deleteDatasetService(
      req.params.id,
      req.user.userId
    );

    return res.json({
      message:
        "Dataset deleted successfully.",
    });

  } catch (error) {

    console.error(error);

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

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized.",
      });
    }

    const preview =
  await previewDataset(
    req.params.id,
    req.user!.userId
  );

    return res.json(preview);

  } catch (error) {

    console.error(error);

    return res.status(400).json({
      error:
        (error as Error).message,
    });

  }
}

