import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export async function getPlans() {
  const response = await axios.get(
    `${API}/api/billing/plans`
  );

  return response.data;
}


export async function createCheckout(
  planId: string,
  interval: "MONTHLY" | "YEARLY",
  token: string
) {

  const response = await axios.post(
    `${API}/api/billing/checkout`,
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
    `${API}/api/billing/subscription`,
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
    `${API}/api/billing/entitlements`,
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
    `${API}/api/billing/verify`,
    {
      params: {
        reference,
      },
    }
  );

  return response.data;
}


