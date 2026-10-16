import axios from "axios";
import { getApiBaseUrl } from "../constants/config";

const client = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

export default client;