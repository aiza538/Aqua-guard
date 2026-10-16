import Constants, { ExecutionEnvironment } from "expo-constants";

const CHANNEL_ID = "aquaguard-alerts";
const MAX_ALERTS = 50;

let notifications = null;
let notificationsBroken = false;
let channelReady = false;

const listeners = new Set();
let recentAlerts = [];

function isExpoGo() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function loadNotifications() {
  if (notifications || notificationsBroken) return notifications;
  try {
    // Expo Go (SDK 53+) me remote/local notifications module import hi nahi hota,
    // isliye lazy load karte hain aur failure ko swallow karke in-app alerts par girate hain.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notifications = require("expo-notifications");
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {
    notificationsBroken = true;
    notifications = null;
    console.warn("[alerts] expo-notifications unavailable, using in-app alerts:", err?.message);
  }
  return notifications;
}

function emit() {
  listeners.forEach((listener) => listener(recentAlerts));
}

export function subscribeAlerts(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRecentAlerts() {
  return recentAlerts;
}

function recordAlert(alert) {
  const entry = { ...alert, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
  recentAlerts = [entry, ...recentAlerts].slice(0, MAX_ALERTS);
  emit();
  return entry;
}

export async function ensurePermissions() {
  const Notifications = loadNotifications();
  if (!Notifications) return false;

  try {
    const { Platform } = require("react-native");
    if (Platform.OS === "android" && !channelReady) {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Farm Alerts",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
      channelReady = true;
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch (err) {
    notificationsBroken = true;
    console.warn("[alerts] permission request failed:", err?.message);
    return false;
  }
}

export async function pushAlert(title, body, data) {
  const entry = recordAlert({ title, body, data: data || {} });

  const Notifications = loadNotifications();
  if (!Notifications) return entry;

  try {
    if (await ensurePermissions()) {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: data || {} },
        trigger: null,
      });
    }
  } catch (err) {
    console.warn("[alerts] schedule failed:", err?.message);
  }
  return entry;
}

export function isNativeAlertsAvailable() {
  return !isExpoGo();
}

export function moistureAlertTitle(deviceName) {
  return `${deviceName}: soil moisture low`;
}

export function moistureAlertBody(value, threshold) {
  return `Moisture is ${value}% — below the ${threshold}% threshold. Irrigation may be needed.`;
}

export function offlineAlertTitle(deviceName) {
  return `${deviceName} is offline`;
}

export function offlineAlertBody(host) {
  return `No response from ${host}. Check the power and WiFi connection.`;
}