import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeHost } from "../api/sensorApi";

const DEVICES_KEY = "aquaguard_devices";
const ACTIVE_KEY = "aquaguard_active_device";

export async function loadDevices() {
  try {
    const raw = await AsyncStorage.getItem(DEVICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Device load error:", err);
    return [];
  }
}

async function persist(devices) {
  await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
  return devices;
}

export async function saveDevice(device) {
  const devices = await loadDevices();
  const entry = {
    id: device.device_id || device.id || device.host,
    name: device.name || device.device_id || device.host,
    host: normalizeHost(device.host),
    firmware: device.firmware || null,
    addedAt: Date.now(),
    lastKnownIps: [],
  };
  const index = devices.findIndex((item) => item.id === entry.id);
  if (index >= 0) {
    devices[index] = { ...devices[index], ...entry, addedAt: devices[index].addedAt };
  } else {
    devices.push(entry);
  }
  return persist(devices);
}

export async function updateDevice(deviceId, patch) {
  const devices = await loadDevices();
  const index = devices.findIndex((item) => item.id === deviceId);
  if (index < 0) return devices;
  devices[index] = { ...devices[index], ...patch };
  return persist(devices);
}

export async function rememberIps(deviceId, ip) {
  const devices = await loadDevices();
  const index = devices.findIndex((item) => item.id === deviceId);
  if (index < 0) return devices;
  const known = devices[index].lastKnownIps || [];
  if (!known.includes(ip)) {
    known.push(ip);
  }
  devices[index].lastKnownIps = known.slice(-5);
  return persist(devices);
}

export async function removeDevice(deviceId) {
  const devices = await loadDevices();
  const next = devices.filter((item) => item.id !== deviceId);
  return persist(next);
}

export async function getActiveDeviceId() {
  try {
    return await AsyncStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export async function setActiveDeviceId(deviceId) {
  if (deviceId) {
    await AsyncStorage.setItem(ACTIVE_KEY, deviceId);
  } else {
    await AsyncStorage.removeItem(ACTIVE_KEY);
  }
}