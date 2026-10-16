import axios from "axios";

export const DEFAULT_TIMEOUT = 4000;
export const SCAN_TIMEOUT = 1800;

export function normalizeHost(host) {
  if (!host) return "";
  let value = String(host).trim();
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) {
    value = `http://${value}`;
  }
  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/+$/, "");
    if (!url.port && url.protocol === "http:") {
      url.port = "80";
    }
    return url.origin;
  } catch {
    return "";
  }
}

export function buildUrl(host, path, params) {
  const base = normalizeHost(host);
  if (!base) return "";
  const query = params
    ? Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&")
    : "";
  return query ? `${base}${path}?${query}` : `${base}${path}`;
}

function makeClient(timeout = DEFAULT_TIMEOUT) {
  return axios.create({
    timeout,
    headers: { Accept: "application/json" },
  });
}

export async function getDeviceInfo(host) {
  const url = buildUrl(host, "/info");
  if (!url) throw new Error("invalid_host");
  const response = await makeClient().get(url);
  return response.data;
}

export async function getSensors(host) {
  const url = buildUrl(host, "/sensors");
  if (!url) throw new Error("invalid_host");
  const response = await makeClient().get(url);
  return response.data;
}

export async function setRelay(host, index, state) {
  const url = buildUrl(host, "/relay", { index, state: state ? 1 : 0 });
  if (!url) throw new Error("invalid_host");
  const response = await makeClient().get(url);
  return response.data;
}

export async function getHistory(host) {
  const url = buildUrl(host, "/history");
  if (!url) throw new Error("invalid_host");
  const response = await makeClient(6000).get(url);
  return response.data;
}

export async function pingDevice(host) {
  const startedAt = Date.now();
  try {
    const info = await getDeviceInfo(host);
    return { online: true, latencyMs: Date.now() - startedAt, info };
  } catch {
    return { online: false, latencyMs: null, info: null };
  }
}

export function signalQuality(rssi) {
  if (typeof rssi !== "number") return 0;
  if (rssi >= -60) return 4;
  if (rssi >= -70) return 3;
  if (rssi >= -80) return 2;
  if (rssi >= -90) return 1;
  return 0;
}