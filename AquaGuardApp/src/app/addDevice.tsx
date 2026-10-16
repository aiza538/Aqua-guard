import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Colors } from "../constants/theme";
import { getLocalIp, probeHost, scanSubnet, subnetFromBaseIp } from "../services/discovery";
import { useDevices } from "../context/DeviceContext";

export default function AddDeviceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { devices, addDevice } = useDevices();

  const [manualIp, setManualIp] = useState("");
  const [probing, setProbing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [found, setFound] = useState<any[]>([]);
  const [error, setError] = useState("");

  const subnet = subnetFromBaseIp(getLocalIp());
  const savedIds = devices.map((d) => d.id);

  useEffect(() => {
    setFound((prev) =>
      devices.map((d) => ({
        ...d,
        device_id: d.id,
        ip: String(d.host).replace(/^https?:\/\//, ""),
        saved: true,
      }))
    );
  }, [devices]);

  const handleManualAdd = useCallback(async () => {
    setError("");
    const value = manualIp.trim();
    if (!value) {
      setError(t("enter_device_ip"));
      return;
    }
    setProbing(true);
    const device = await probeHost(value);
    setProbing(false);

    if (!device) {
      setError(t("device_not_found"));
      return;
    }
    await addDevice(device);
    router.replace({ pathname: "/deviceDetail", params: { id: device.device_id } });
  }, [addDevice, manualIp, router, t]);

  const handleScan = useCallback(async () => {
    setError("");
    setScanning(true);
    setScanProgress(0);
    const results = await scanSubnet(subnet, (_device: any, count: number) =>
      setScanProgress(count)
    );
    setScanning(false);
    setFound((prev) => {
      const merged = [...results];
      for (const item of prev) {
        if (item.saved && !merged.some((m) => m.device_id === item.device_id)) {
          merged.push(item);
        }
      }
      return merged.map((item) => ({
        ...item,
        saved: savedIds.includes(item.device_id),
      }));
    });
    if (!results.length) {
      setError(t("scan_no_results"));
    }
  }, [subnet, t]);

  const handlePair = useCallback(
    async (device: any) => {
      setError("");
      await addDevice(device);
      router.replace({ pathname: "/deviceDetail", params: { id: device.device_id } });
    },
    [addDevice, router]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>{t("connect_manually")}</Text>
        <View style={styles.card}>
          <Text style={styles.hint}>{t("manual_ip_hint")}</Text>
          <TextInput
            style={styles.input}
            placeholder="192.168.100.50  or  aquaguard-node-01.local"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={manualIp}
            onChangeText={setManualIp}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleManualAdd} disabled={probing}>
            {probing ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>{t("connect")}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t("scan_network")}</Text>
        <View style={styles.card}>
          <Text style={styles.hint}>
            {t("scan_hint", { subnet: subnet || "—" })}
          </Text>
          <TouchableOpacity style={styles.scanButton} onPress={handleScan} disabled={scanning}>
            {scanning ? (
              <View style={styles.scanRow}>
                <ActivityIndicator color={Colors.white} size="small" />
                <Text style={styles.primaryButtonText}>
                  {t("scanning", { count: scanProgress })}
                </Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>{t("scan_network")}</Text>
            )}
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{t("warning")} {error}</Text> : null}

        {found.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t("found_devices")} ({found.length})</Text>
            {found.map((device) => (
              <View key={device.device_id} style={styles.deviceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceHost}>{device.ip}</Text>
                  <Text style={styles.deviceMeta}>
                    {device.firmware ? `v${device.firmware} · ` : ""}
                    {typeof device.rssi === "number" ? `${device.rssi} dBm` : ""}
                  </Text>
                </View>
                {device.saved ? (
                  <Text style={styles.savedTag}>{t("added")}</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.pairButton}
                    onPress={() => handlePair(device)}
                  >
                    <Text style={styles.pairButtonText}>{t("add")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() =>
            Alert.alert(t("firmware_help_title"), t("firmware_help_body"))
          }
        >
          <Text style={styles.linkText}>{t("firmware_help")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 10,
    marginTop: 12,
  },
  card: { backgroundColor: Colors.card, borderRadius: 14, padding: 16 },
  hint: { fontSize: 12, color: Colors.textLight, marginBottom: 12, lineHeight: 18 },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: "#e0e8e4",
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  scanRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  primaryButtonText: { color: Colors.white, fontWeight: "600", fontSize: 14 },
  error: { color: Colors.danger, fontSize: 12.5, marginTop: 14 },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  deviceName: { fontSize: 14.5, fontWeight: "700", color: Colors.text },
  deviceHost: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  deviceMeta: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  savedTag: { color: Colors.accent, fontWeight: "700", fontSize: 12 },
  pairButton: {
    backgroundColor: Colors.accent,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  pairButtonText: { color: Colors.white, fontWeight: "700", fontSize: 13 },
  linkButton: { marginTop: 24, alignItems: "center" },
  linkText: { color: Colors.secondary, fontSize: 13, fontWeight: "600" },
});