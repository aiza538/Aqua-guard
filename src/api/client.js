import axios from "axios";

const BASE_URL = "http://192.168.100.30:5000";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default client;
