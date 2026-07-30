import axios from "axios";

const API =
  "http://localhost:5000/api";

export async function getDatasetProfile(
  datasetId: string
) {
  const response =
    await axios.get(
      `${API}/datasets/${datasetId}/profile`
    );

  return response.data.data;
}

