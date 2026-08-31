import { Request, Response } from "express";
import fs from "node:fs";
import prisma from "../lib/prisma";
import { previewDataset } from "../services/previewService";
import { getUsageLimit } from "../services/billingService";
import {
  getDatasets as getDatasetsService,
  deleteDataset as deleteDatasetService,
} from "../services/datasetService";

interface DatasetParams {
  id: string;
}

export async function uploadDataset(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded.",
      });
    }

    if (!req.user) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(401).json({
        error: "Unauthorized.",
      });
    }

    const userId = req.user.userId;

    // Check storage capacity limit from active plan
    const storageLimitMb = await getUsageLimit(userId, "storageMb");

    if (storageLimitMb !== null) {
      const currentStorageAggregate = await prisma.dataset.aggregate({
        where: { userId },
        _sum: { size: true },
      });

      const currentStorageBytes = currentStorageAggregate._sum.size || 0;
      const maxAllowedBytes = storageLimitMb * 1024 * 1024;

      if (currentStorageBytes + req.file.size > maxAllowedBytes) {
        // Clean up uploaded file on disk
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(403).json({
          error: `Storage capacity limit of ${storageLimitMb} MB exceeded. Upgrade your plan to store more data.`,
          code: "STORAGE_LIMIT_EXCEEDED",
          limitMb: storageLimitMb,
          currentStorageMb:
            Math.round((currentStorageBytes / (1024 * 1024)) * 100) / 100,
        });
      }
    }

    const dataset = await prisma.dataset.create({
      data: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        userId,
      },
    });

    return res.status(201).json({
      message: "Dataset uploaded successfully.",
      dataset,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error(error);

    return res.status(500).json({
      error: "Failed to upload dataset.",
    });
  }
}

export async function getDatasets(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized.",
      });
    }

    const datasets = await getDatasetsService(req.user.userId);

    return res.json(datasets);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to retrieve datasets.",
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

    await deleteDatasetService(req.params.id, req.user.userId);

    return res.json({
      message: "Dataset deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(404).json({
      error: (error as Error).message,
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

    const preview = await previewDataset(req.params.id, req.user.userId);

    return res.json(preview);
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      error: (error as Error).message,
    });
  }
}

