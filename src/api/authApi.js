import client from "./client";

export async function signup(name, phone, password) {
  const response = await client.post("/api/auth/signup", {
    name,
    phone,
    password,
  });
  return response.data;
}

export async function login(phone, password) {
  const response = await client.post("/api/auth/login", { phone, password });
  return response.data;
}

export async function forgotPassword(phone) {
  const response = await client.post("/api/auth/forgot-password", { phone });
  return response.data;
}
