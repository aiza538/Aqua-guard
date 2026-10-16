import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AppState } from "react-native";
import { getHistory, getSensors, setRelay, signalQuality } from "../api/sensorApi";
import {
  getActiveDeviceId,
  loadDevices,
  removeDevice,
  rememberIps,
  saveDevice,
  setActiveDeviceId,
} from "../services/deviceStore";
import {
  getRecentAlerts,
  moistureAlertBody,
  moistureAlertTitle,
  offlineAlertBody,
  offlineAlertTitle,
  pushAlert,
  subscribeAlerts,
} from "../services/alerts";

const POLL_INTERVAL_MS = 5000;
export const MOISTURE_THRESHOLD = 25;

export type DeviceEntry = {
  id: string;
  name: string;
  host: string;
  firmware: string | null;
  addedAt: number;
  lastKnownIps: string[];
};

export type DiscoveredDevice = {
  id?: string;
  device_id: string;
  name: string;
  host: string;
  ip?: string;
  firmware: string | null;
  mac?: string | null;
  rssi?: number | null;
  saved?: boolean;
};

export type SensorReading = {
  device_id?: string;
  timestamp?: number;
  soil_moisture?: number;
  temperature?: number;
  humidity?: number;
  water_level?: number;
  rssi?: number;
  relays?: boolean[];
};

export type HistoryReading = {
  ts: number;
  soil_moisture?: number;
  temperature?: number;
  humidity?: number;
  water_level?: number;
};

export type DeviceHealth = {
  online: boolean;
  lastSeen: number | null;
  rssi: number | null;
  latencyMs: number | null;
};

export type FarmAlert = {
  id: string;
  title: string;
  body: string;
  data: Record<string, string>;
};

export type DeviceContextValue = {
  devices: DeviceEntry[];
  loading: boolean;
  activeDevice: DeviceEntry | null;
  activeDeviceId: string | null;
  live: Record<string, SensorReading | undefined>;
  health: Record<string, DeviceHealth | undefined>;
  history: Record<string, HistoryReading[] | undefined>;
  alerts: FarmAlert[];
  clearAlerts: () => void;
  relayBusy: boolean;
  setActiveDevice: (deviceId: string | null) => Promise<void>;
  addDevice: (device: DiscoveredDevice) => Promise<DeviceEntry[]>;
  deleteDevice: (deviceId: string) => Promise<void>;
  refreshDevice: (deviceId: string) => Promise<void>;
  pollAll: () => Promise<void>;
  toggleRelay: (deviceId: string, index: number, nextState: boolean) => Promise<void>;
  loadDeviceHistory: (deviceId: string) => Promise<HistoryReading[]>;
  signalQuality: (rssi: number | null) => number;
  moistureThreshold: number;
};

const DeviceContext = createContext<DeviceContextValue | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<DeviceEntry[]>([]);
  const [activeDeviceId, setActiveDeviceIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState<Record<string, SensorReading | undefined>>({});
  const [health, setHealth] = useState<Record<string, DeviceHealth | undefined>>({});
  const [relayBusy, setRelayBusy] = useState(false);
  const [history, setHistory] = useState<Record<string, HistoryReading[] | undefined>>({});
  const [alerts, setAlerts] = useState<FarmAlert[]>(getRecentAlerts());

  const alertState = useRef<Record<string, { lowMoisture?: boolean; offline?: boolean; wasOnline?: boolean }>>({});
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => subscribeAlerts((next: FarmAlert[]) => setAlerts(next)), []);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  useEffect(() => {
    (async () => {
      const [stored, storedActive] = await Promise.all([loadDevices(), getActiveDeviceId()]);
      setDevices(stored);
      if (storedActive && stored.some((d) => d.id === storedActive)) {
        setActiveDeviceIdState(storedActive);
      } else if (stored.length === 1) {
        setActiveDeviceIdState(stored[0].id);
      }
      setLoading(false);
    })();
  }, []);

  const pollDevice = useCallback(async (device: DeviceEntry) => {
    try {
      const data = await getSensors(device.host);
      setLive((prev) => ({ ...prev, [device.id]: data }));
      setHealth((prev) => ({
        ...prev,
        [device.id]: {
          online: true,
          lastSeen: Date.now(),
          rssi: typeof data.rssi === "number" ? data.rssi : null,
          latencyMs: null,
        },
      }));

      const moisture = data.soil_moisture;
      const previous = alertState.current[device.id] || {};
      const lowMoisture = typeof moisture === "number" && moisture < MOISTURE_THRESHOLD;
      if (lowMoisture && !previous.lowMoisture) {
        pushAlert(
          moistureAlertTitle(device.name),
          moistureAlertBody(Math.round(moisture as number), MOISTURE_THRESHOLD),
          { deviceId: device.id, screen: "deviceDetail" }
        );
      }
      alertState.current[device.id] = { ...previous, lowMoisture, offline: false, wasOnline: true };
    } catch (err) {
      const previous = alertState.current[device.id] || {};
      setHealth((prev) => ({
        ...prev,
        [device.id]: {
          online: false,
          lastSeen: prev[device.id]?.lastSeen ?? null,
          rssi: prev[device.id]?.rssi ?? null,
          latencyMs: null,
        },
      }));
      if (!previous.offline && previous.wasOnline) {
        pushAlert(offlineAlertTitle(device.name), offlineAlertBody(device.host), { deviceId: device.id });
      }
      alertState.current[device.id] = { ...previous, offline: true };
    }
  }, []);

  const pollAll = useCallback(async () => {
    if (!devices.length) return;
    await Promise.all(devices.map((device) => pollDevice(device)));
  }, [devices, pollDevice]);

  useEffect(() => {
    if (!devices.length) return undefined;
    pollAll();
    pollTimer.current = setInterval(pollAll, POLL_INTERVAL_MS);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [devices, pollAll]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") pollAll();
    });
    return () => subscription.remove();
  }, [pollAll]);

  const setActiveDevice = useCallback(async (deviceId: string | null) => {
    setActiveDeviceIdState(deviceId);
    await setActiveDeviceId(deviceId);
  }, []);

  const addDevice = useCallback(async (device: DiscoveredDevice) => {
    await saveDevice(device as unknown as Partial<DeviceEntry>);
    const refreshed = await loadDevices();
    setDevices(refreshed);
    const deviceId = device.device_id || device.id || "";
    if (device.ip) await rememberIps(deviceId, device.ip);
    setActiveDeviceIdState(deviceId);
    await setActiveDeviceId(deviceId);
    return refreshed;
  }, []);

  const deleteDevice = useCallback(
    async (deviceId: string) => {
      const next = await removeDevice(deviceId);
      setDevices(next);
      if (activeDeviceId === deviceId) {
        setActiveDeviceIdState(null);
        await setActiveDeviceId(null);
      }
    },
    [activeDeviceId]
  );

  const refreshDevice = useCallback(
    async (deviceId: string) => {
      const device = devices.find((item) => item.id === deviceId);
      if (device) await pollDevice(device);
    },
    [devices, pollDevice]
  );

  const toggleRelay = useCallback(
    async (deviceId: string, index: number, nextState: boolean) => {
      const device = devices.find((item) => item.id === deviceId);
      if (!device || relayBusy) return;

      setRelayBusy(true);
      setLive((prev) => {
        const current = prev[deviceId];
        if (!current) return prev;
        const relays = [...(current.relays || [])];
        relays[index] = nextState;
        return { ...prev, [deviceId]: { ...current, relays } };
      });

      try {
        await setRelay(device.host, index, nextState);
        await pollDevice(device);
      } catch (err) {
        setLive((prev) => {
          const current = prev[deviceId];
          if (!current) return prev;
          const relays = [...(current.relays || [])];
          relays[index] = !nextState;
          return { ...prev, [deviceId]: { ...current, relays } };
        });
      } finally {
        setRelayBusy(false);
      }
    },
    [devices, pollDevice, relayBusy]
  );

  const loadDeviceHistory = useCallback(
    async (deviceId: string) => {
      const device = devices.find((item) => item.id === deviceId);
      if (!device) return [];
      try {
        const data = await getHistory(device.host);
        const readings = (data?.readings || []) as HistoryReading[];
        setHistory((prev) => ({ ...prev, [deviceId]: readings }));
        return readings;
      } catch (err) {
        return [];
      }
    },
    [devices]
  );

  const activeDevice = devices.find((item) => item.id === activeDeviceId) || null;

  const value: DeviceContextValue = {
    devices,
    loading,
    activeDevice,
    activeDeviceId,
    live,
    health,
    history,
    alerts,
    clearAlerts,
    relayBusy,
    setActiveDevice,
    addDevice,
    deleteDevice,
    refreshDevice,
    pollAll,
    toggleRelay,
    loadDeviceHistory,
    signalQuality,
    moistureThreshold: MOISTURE_THRESHOLD,
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevices(): DeviceContextValue {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevices must be used inside DeviceProvider");
  }
  return context;
}