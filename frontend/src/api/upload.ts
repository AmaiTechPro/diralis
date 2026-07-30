const API_URL =
  `${import.meta.env.VITE_API_URL}/datasets/upload`;

export interface UploadResponse {
  message: string;

  file: {
    originalName: string;
    filename: string;
    size: number;
    mimetype: string;
  };
}

export async function uploadDataset(
  file: File
): Promise<UploadResponse> {
  const formData = new FormData();

  formData.append("dataset", file);

  const response = await fetch(API_URL, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ?? "Upload failed."
    );
  }

  return data;
}

