import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export async function getPlans() {
  const response = await axios.get(
    `${API}/billing/plans`
  );

  return response.data;
}


export async function createCheckout(
  planId: string,
  interval: "MONTHLY" | "YEARLY",
  token: string
) 

{

  const response = await axios.post(
    `${API}/billing/checkout`,
    {
      planId,
      interval,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}


export async function getSubscription(
  token: string
) {

  const response = await axios.get(
    `${API}/billing/subscription`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}


export async function getEntitlements(
  token: string
) {

  const response = await axios.get(
    `${API}/billing/entitlements`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}


export async function verifyPayment(
  reference: string
) {
  const response = await axios.get(
    `${API}/billing/verify`,
    {
      params: {
        reference,
      },
    }
  );

  return response.data;
}


export async function getBillingHistory(token: string) {
  const response = await axios.get(
    `${API}/billing/history`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}


