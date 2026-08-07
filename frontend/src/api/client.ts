const API_URL = import.meta.env.VITE_API_URL;

function getHeaders(includeJson = true): HeadersInit {
  const token = localStorage.getItem("token");

  return {
    ...(includeJson && {
      "Content-Type": "application/json",
    }),

    ...(token && {
      Authorization: `Bearer ${token}`,
    }),
  };
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,

      headers: {
        ...getHeaders(
          !(options.body instanceof FormData)
        ),

        ...(options.headers || {}),
      },
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      "Request failed."
    );
  }

  return data as T;
}

