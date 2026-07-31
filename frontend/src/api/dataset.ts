import { apiFetch } from "./client";
import type { Dataset } from "../types/dataset";

export async function fetchDatasets(): Promise<Dataset[]> {
  return apiFetch("/datasets");
}

