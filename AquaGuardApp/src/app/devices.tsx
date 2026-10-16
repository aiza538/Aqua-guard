import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../constants/theme";
import DeviceCard from "../components/DeviceCard";
import { useDevices } from "../context/DeviceContext";
import type { DeviceEntry } from "../context/DeviceContext";

export default function DevicesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { devices, live, health, activeDeviceId, setActiveDevice, pollAll, alerts, clearAlerts } = useDevices();
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await pollAll();
    setRefreshing(false);
  }, [pollAll]);

  const onlineCount = devices.filter((d) => health[d.id]?.online).length;

  const openDevice = useCallback(
    async (device: DeviceEntry) => {
      await setActiveDevice(device.id);
      router.push({ pathname: "/deviceDetail", params: { id: device.id } });
    },
    [router, setActiveDevice]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <LinearGradient colors={["#0d3b2e", "#1b5e42"]} style={styles.header}>
          <Text style={styles.headerTitle}>{t("my_devices")}</Text>
          <Text style={styles.headerSub}>
            {onlineCount}/{devices.length} {t("online")}
          </Text>
        </LinearGradient>

        {alerts.length > 0 && (
          <View style={styles.alertBox}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertHeaderText}>
                🔔 {t('recent_alerts')} ({alerts.length})
              </Text>
              <TouchableOpacity onPress={clearAlerts}>
                <Text style={styles.alertClear}>{t("clear")}</Text>
              </TouchableOpacity>
            </View>
            {alerts.slice(0, 5).map((alert) => (
              <View key={alert.id} style={styles.alertRow}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertBody}>{alert.body}</Text>
              </View>
            ))}
          </View>
        )}

        {devices.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyTitle}>{t("no_devices_title")}</Text>
            <Text style={styles.emptyText}>{t("no_devices_subtitle")}</Text>
          </View>
        ) : (
          devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              live={live[device.id]}
              health={health[device.id]}
              active={device.id === activeDeviceId}
              onPress={() => openDevice(device)}
            />
          ))
        )}

        <TouchableOpacity style={styles.addButton} onPress={() => router.push("/addDevice")}>
          <Text style={styles.addButtonText}>+ {t("add_device")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { borderRadius: 20, padding: 22, marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: Colors.white },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  empty: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
  },
  alertBox: {
    backgroundColor: "#fdf6e3",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  alertHeaderText: { fontSize: 12.5, fontWeight: "700", color: "#8a6d00" },
  alertClear: { fontSize: 12, color: Colors.secondary, fontWeight: "600" },
  alertRow: { marginTop: 6 },
  alertTitle: { fontSize: 12.5, fontWeight: "700", color: Colors.text },
  alertBody: { fontSize: 11.5, color: Colors.textLight, marginTop: 1 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  emptyText: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },
  addButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 16,
  },
  addButtonText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});
