import api from "./api";


export async function getSettings(){

  const response =
    await api.get("/settings");

  return response.data;

}



export async function updateSettings(
  data:{
    theme:string;
    notifications:boolean;
  }
){

  const response =
    await api.patch(
      "/settings",
      data
    );


  return response.data;

}

