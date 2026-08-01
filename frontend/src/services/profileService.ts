import api from "./api";


export async function getUserProfile() {

  const response =
    await api.get("/profile");

  return response.data;

}

