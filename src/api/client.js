import axios from "axios";
import { Platform } from "react-native";

// Web par localhost use hoga, native devices par LAN IP
const BASE_URL = Platform.OS === "web"
  ? "http://localhost:5000"
  : "http://10.160.65.251:5000";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default client;
