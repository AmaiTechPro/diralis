const API_URL =
  `${import.meta.env.VITE_API_URL}/datasets`;

export async function deleteDataset(
  id: string
) {
  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to delete dataset."
    );
  }

  return response.json();
}

