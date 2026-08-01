import api from "./api";


export async function analyzePrediction(
  payload:any
){

  const response =
    await api.post(
      "/predictions/analyze",
      payload
    );


  return response.data;

}


