import { apiFetch } from "./client";
import type { PreviewResult } from "../types/preview";

export async function previewDataset(
  id: string
): Promise<PreviewResult> {
  return apiFetch(`/datasets/${id}/preview`);
}

