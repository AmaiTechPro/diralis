import api from "./api";



export async function getSettings(){

  const response =
    await api.get("/settings");


  return response.data;

}





export async function updateSettings(
  data:{
    theme:string;
    emailNotifications:boolean;
  }
){

  const response =
    await api.patch(
      "/settings",
      data
    );


  return response.data;

}





export async function updateProfile(
  data:{
    fullName:string;
    email:string;
  }
){

  const response =
    await api.patch(
      "/settings/profile",
      data
    );


  return response.data;

}





export async function changePassword(
  data:{
    currentPassword:string;
    newPassword:string;
  }
){

  const response =
    await api.put(
      "/settings/password",
      data
    );


  return response.data;

}

