export async function getOverallInsights() {
  const token = localStorage.getItem("token");

  const response = await fetch(
    "http://localhost:5000/api/overall-insights",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load AI Insights");
  }

  return response.json();
}

