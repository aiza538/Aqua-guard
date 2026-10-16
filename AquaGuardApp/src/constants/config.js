import Constants from "expo-constants";

const DEFAULT_API_URL = "http://10.5.56.19:5000";

function stripScheme(value) {
  return String(value || "").replace(/^https?:\/\//, "").split("/")[0];
}

export function getDevHost() {
  const config = Constants.expoConfig || {};
  const fromHostUri =
    config.hostUri ||
    Constants.manifest2?.extra?.expoGo?.developer?.host ||
    Constants.manifest?.extra?.expoGo?.developer?.host;
  if (fromHostUri) return stripScheme(fromHostUri);
  return "";
}

export function getLocalIp() {
  const extraUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraUrl) return stripScheme(extraUrl);
  return stripScheme(DEFAULT_API_URL);
}

export function getApiBaseUrl() {
  const extraUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraUrl) return String(extraUrl).replace(/\/+$/, "");

  const host = getDevHost();
  if (host) {
    const ip = host.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:5000`;
    }
  }

  return DEFAULT_API_URL;
}

export function describeApiError(err) {
  if (!err) return "Unknown error";
  if (err.response) {
    const data = err.response.data;
    if (data?.error) return data.error;
    return `Server returned ${err.response.status}`;
  }
  if (err.code === "ECONNABORTED") {
    return `Request timed out. Backend not reachable at ${getApiBaseUrl()}`;
  }
  if (err.code === "ERR_NETWORK" || err.message?.includes("Network Error")) {
    return `Cannot reach backend at ${getApiBaseUrl()}. Phone and PC must be on the same WiFi.`;
  }
  return err.message || "Request failed";
}

export { DEFAULT_API_URL };