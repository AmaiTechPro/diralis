const API = "http://localhost:5000/api";

export async function getReport() {
  const response = await fetch(`${API}/reports`);

  if (!response.ok) {
    throw new Error("Failed to load report");
  }

  return response.json();
}

