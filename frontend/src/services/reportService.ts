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
    await fetch(
      url,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


  if (!response.ok) {
    throw new Error(
      "Failed to load report"
    );
  }


  return response.json();

}
