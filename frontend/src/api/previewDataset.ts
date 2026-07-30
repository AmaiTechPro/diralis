const API_URL =
  "http://localhost:5000/api/datasets";

export async function previewDataset(
  id: string
) {
  const response = await fetch(
    `${API_URL}/${id}/preview`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load dataset preview."
    );
  }

  return response.json();
}


