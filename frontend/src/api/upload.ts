import { apiFetch } from "./client";

export interface UploadResponse {
  message: string;

  dataset: {
    id: string;
    originalName: string;
    filename: string;
    size: number;
    mimetype: string;
    uploadedAt: string;
    userId: string;
  };
}

export async function uploadDataset(
  file: File
): Promise<UploadResponse> {
  const formData = new FormData();

  formData.append(
    "dataset",
    file
  );

  return apiFetch(
    "/datasets/upload",
    {
      method: "POST",
      body: formData,
    }
  );
}

