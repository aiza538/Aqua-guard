import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../constants/theme";
import SensorGauge from "../components/SensorGauge";
import ValveToggleButton from "../components/ValveToggleButton";
import DeviceStatusBar from "../components/DeviceStatusBar";
import { useDevices } from "../context/DeviceContext";
import { getDeviceInfo } from "../api/sensorApi";

export default function DeviceDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const deviceId = params.id ?? "";

  const {
    devices,
    live,
    health,
    relayBusy,
    refreshDevice,
    toggleRelay,
    deleteDevice,
    moistureThreshold,
  } = useDevices();

  const device = devices.find((d) => d.id === deviceId);
  const data = live[deviceId];
  const deviceHealth = health[deviceId];

  const [info, setInfo] = useState<any>(null);
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!device) return;
    getDeviceInfo(device.host)
      .then(setInfo)
      .catch(() => setInfo(null));
  }, [device]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshDevice(deviceId);
    if (device) {
      getDeviceInfo(device.host).then(setInfo).catch(() => setInfo(null));
    }
    setRefreshing(false);
  }, [device, deviceId, refreshDevice]);

  const handleDelete = useCallback(() => {
    Alert.alert(t("remove_device_title"), t("remove_device_body"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("remove"),
        style: "destructive",
        onPress: async () => {
          await deleteDevice(deviceId);
          router.replace("/devices");
        },
      },
    ]);
  }, [deleteDevice, deviceId, router, t]);

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📡</Text>
          <Text style={styles.emptyText}>{t("device_not_added")}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace("/addDevice")}>
            <Text style={styles.primaryButtonText}>{t("add_device")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOnline = deviceHealth?.online === true;
  const relays = data?.relays || [];
  const moisture = data?.soil_moisture;
  const isDry = typeof moisture === "number" && moisture < moistureThreshold;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient colors={["#0d3b2e", "#1b5e42"]} style={styles.header}>
          <Text style={styles.headerName}>{device.name}</Text>
          <Text style={styles.headerHost}>
            {String(device.host).replace(/^https?:\/\//, "")}
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            {refreshing ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.refreshText}>{t("refresh")}</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>

        <DeviceStatusBar info={info} health={deviceHealth} live={data} now={now} />

        {isDry ? (
          <View style={styles.warnBanner}>
            <Text style={styles.warnText}>
              ⚠️ {t("moisture_low", { value: Math.round(moisture) })}
            </Text>
          </View>
        ) : null}

        {!isOnline && deviceHealth ? (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>{t("device_offline_hint")}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>{t("live_readings")}</Text>
        <View style={styles.gaugeRow}>
          <SensorGauge
            label={t("soil_moisture")}
            value={typeof moisture === "number" ? String(Math.round(moisture)) : "--"}
            unit="%"
            icon="🌱"
          />
          <SensorGauge
            label={t("temperature")}
            value={typeof data?.temperature === "number" ? data.temperature.toFixed(1) : "--"}
            unit="°C"
            icon="🌡️"
          />
          <SensorGauge
            label={t("humidity")}
            value={typeof data?.humidity === "number" ? String(Math.round(data.humidity)) : "--"}
            unit="%"
            icon="💧"
          />
          <SensorGauge
            label={t("water_level")}
            value={typeof data?.water_level === "number" ? String(Math.round(data.water_level)) : "--"}
            unit="%"
            icon="🚰"
          />
        </View>

        <Text style={styles.sectionTitle}>{t("remote_control")}</Text>
        <ValveToggleButton
          label={t("drip_irrigation")}
          value={!!relays[0]}
          onToggle={() => toggleRelay(deviceId, 0, !relays[0])}
        />
        <ValveToggleButton
          label={t("sprinkler_system")}
          value={!!relays[1]}
          onToggle={() => toggleRelay(deviceId, 1, !relays[1])}
        />
        {relayBusy ? (
          <Text style={styles.busyText}>{t("sending_command")}</Text>
        ) : null}

        <Text style={styles.sectionTitle}>{t("quick_actions")}</Text>
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: "/history", params: { id: deviceId } })}
        >
          <View style={styles.actionIconBox}>
            <Text style={styles.actionIcon}>📈</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>{t("view_history")}</Text>
            <Text style={styles.actionSubtitle}>{t("view_history_subtitle")}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.removeButton} onPress={handleDelete}>
          <Text style={styles.removeText}>{t("remove_device")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyText: { fontSize: 15, color: Colors.text, marginBottom: 18 },
  scroll: { padding: 20, paddingBottom: 40, gap: 12 },
  header: { borderRadius: 20, padding: 22, marginBottom: 4 },
  headerName: { fontSize: 22, fontWeight: "800", color: Colors.white },
  headerHost: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  refreshBtn: { position: "absolute", right: 18, bottom: 20 },
  refreshText: { color: Colors.white, fontSize: 13, fontWeight: "600" },
  warnBanner: {
    backgroundColor: "#fdf6e3",
    borderRadius: 12,
    padding: 12,
  },
  warnText: { fontSize: 12.5, color: "#8a6d00", fontWeight: "600" },
  offlineBanner: { backgroundColor: "#fdecea", borderRadius: 12, padding: 12 },
  offlineText: { fontSize: 12.5, color: Colors.danger },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginTop: 10 },
  gaugeRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  busyText: { fontSize: 11.5, color: Colors.textLight, marginTop: -4 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    backgroundColor: "#e3f2ea",
  },
  actionIcon: { fontSize: 22 },
  actionTitle: { fontSize: 15, fontWeight: "600", color: Colors.text },
  actionSubtitle: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  arrow: { fontSize: 26, color: Colors.textLight },
  removeButton: { marginTop: 22, alignItems: "center" },
  removeText: { color: Colors.danger, fontSize: 14, fontWeight: "600" },
  primaryButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    paddingHorizontal: 26,
  },
  primaryButtonText: { color: Colors.white, fontWeight: "600", fontSize: 14 },
});