import type { Dataset } from "../types/dataset";

const API_URL =
  `${import.meta.env.VITE_API_URL}/datasets`;

export async function fetchDatasets(): Promise<
  Dataset[]
> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(
      "Failed to load datasets."
    );
  }

  return response.json();
}

