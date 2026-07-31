import { apiFetch } from "./client";

export async function deleteDataset(id: string) {
  return apiFetch(`/datasets/${id}`, {
    method: "DELETE",
  });
}

