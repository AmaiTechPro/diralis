import { apiFetch } from "./client";
import type { DatasetProfile } from "../types/profile";

interface ProfileResponse {
  success: boolean;
  data: DatasetProfile;
}

export async function getDatasetProfile(
  datasetId: string
): Promise<DatasetProfile> {
  const response =
    await apiFetch<ProfileResponse>(
      `/datasets/${datasetId}/profile`
    );

  return response.data;
}

