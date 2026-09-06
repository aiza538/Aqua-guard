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

export async function predictIrrigationAuto(formData, token) {
  const response = await client.post("/api/irrigation/predict-auto", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}
