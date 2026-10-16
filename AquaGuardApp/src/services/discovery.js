import { getLocalIp } from "../constants/config";
import { getDeviceInfo, normalizeHost } from "../api/sensorApi";

export { getLocalIp };

const CONCURRENCY = 16;
const SCAN_LIMIT = 120;

export function getSubnetFromHost(host) {
  const cleaned = normalizeHost(host).replace(/^https?:\/\//, "");
  const ip = cleaned.split("/")[0].split(":")[0];
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

export function subnetFromBaseIp(ip) {
  const parts = String(ip).split(".");
  if (parts.length !== 4) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

function candidateIps(subnet, start = 1, end = 254) {
  const ips = [];
  for (let i = start; i <= Math.min(end, SCAN_LIMIT); i++) {
    ips.push(`${subnet}.${i}`);
  }
  return ips;
}

async function probeIp(ip) {
  try {
    const info = await getDeviceInfo(ip);
    if (!info) return null;
    return {
      ip,
      host: normalizeHost(ip),
      device_id: info.device_id || info.name || ip,
      name: info.name || info.device_id || ip,
      firmware: info.firmware || null,
      mac: info.mac || null,
      rssi: typeof info.rssi === "number" ? info.rssi : null,
    };
  } catch {
    return null;
  }
}

export async function scanSubnet(subnetInput, onFound) {
  const subnet = subnetInput || subnetFromBaseIp(getLocalIp());
  if (!subnet) return [];

  const found = [];
  const queue = candidateIps(subnet);
  let index = 0;

  async function worker() {
    while (index < queue.length) {
      const current = queue[index++];
      const device = await probeIp(current);
      if (device) {
        found.push(device);
        onFound?.(device, found.length);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker())
  );
  return found;
}

export async function probeHost(hostInput) {
  const host = normalizeHost(hostInput);
  if (!host) return null;
  try {
    const info = await getDeviceInfo(host);
    return {
      ip: host.replace(/^https?:\/\//, ""),
      host,
      device_id: info.device_id || info.name || host,
      name: info.name || info.device_id || host,
      firmware: info.firmware || null,
      mac: info.mac || null,
      rssi: typeof info.rssi === "number" ? info.rssi : null,
    };
  } catch {
    return null;
  }
}