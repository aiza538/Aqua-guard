import client from "./client";

export async function getDistrictsAndSoilTypes() {
  const response = await client.get("/api/irrigation/districts");
  return response.data;
}

export async function predictIrrigation(payload, token) {
  const response = await client.post("/api/irrigation/predict", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
