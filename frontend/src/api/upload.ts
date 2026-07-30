const API_URL =
  `${import.meta.env.VITE_API_URL}/datasets/upload`;

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

  const token =
    localStorage.getItem("token");

  if (!token) {
    throw new Error(
      "Please login first."
    );
  }

  const formData = new FormData();

  formData.append(
    "dataset",
    file
  );

  const response =
    await fetch(API_URL, {

      method: "POST",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },

      body: formData,

    });

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.error ??
      "Upload failed."
    );

  }

  return data;

}
