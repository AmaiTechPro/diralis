import { apiFetch } from "../api/client";


export async function getAdminUsers() {

  return apiFetch<{
    users: any[];
  }>("/admin/users");

}


export async function getAdminMetrics() {

  return apiFetch<{

    totalUsers: number;

    totalDatasets: number;

    totalReports: number;

    totalAIRequests: number;

  }>("/admin/metrics");

}

export async function changeUserRole(
  id: string,
  role: string
) {

  return apiFetch(
    `/admin/users/${id}/role`,
    {
      method: "PATCH",

      body: JSON.stringify({

        role,

      }),

    }
  );

}


export async function toggleUserStatus(
  id: string
) {

  return apiFetch(
    `/admin/users/${id}/status`,
    {
      method: "PATCH",
    }
  );

}


export async function deleteUser(
  id: string
) {

  return apiFetch(
    `/admin/users/${id}`,
    {
      method: "DELETE",
    }
  );

}



