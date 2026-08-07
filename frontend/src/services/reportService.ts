const API = import.meta.env.VITE_API_URL;

export async function getReport(
  datasetId?: string
) {

  const token =
    localStorage.getItem("token");

  const url =
  datasetId
    ? `${API}/reports?datasetId=${datasetId}`
    : `${API}/reports`;

  const response =
    await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

  if (!response.ok) {

    let message = "Failed to load report";

    try {

      const error =
        await response.json();

      message =
        error.message ?? message;

    } catch {}

    const err = new Error(message) as Error & {
      status?: number;
    };

    err.status =
      response.status;

    throw err;

  }

  return response.json();

}

