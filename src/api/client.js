import axios from "axios";

// Apna backend base URL yahan set karein (Dev 2 deploy karega)
const BASE_URL = "http://10.62.134.208:5000";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default client;
