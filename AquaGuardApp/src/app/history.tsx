import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity, useWindowDimensions } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { LineChart } from "react-native-chart-kit";
import { Colors } from "../constants/theme";
import { useDevices } from "../context/DeviceContext";

const RANGES = [30, 60, 120];

export default function HistoryScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const deviceId = params.id ?? "";
  const { history, loadDeviceHistory } = useDevices();
  const { width } = useWindowDimensions();

  const [range, setRange] = useState(60);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadDeviceHistory(deviceId);
      setLoading(false);
    })();
  }, [deviceId, loadDeviceHistory]);

  const readings = (history[deviceId] || []).slice(-range);

  const chartData = useMemo(() => {
    if (!readings.length) return null;
    const step = Math.max(1, Math.floor(readings.length / 12));
    const sampled = readings.filter((_, i) => i % step === 0 || i === readings.length - 1);
    return {
      labels: sampled.map((_, i) => `${i * step * 2}s`),
      datasets: [
        { data: sampled.map((r) => Math.round(r.soil_moisture ?? 0)), color: () => Colors.secondary },
        { data: sampled.map((r) => Math.round(r.water_level ?? 0)), color: () => "#4a90d9" },
      ],
      legend: [t("soil_moisture"), t("water_level")],
    };
  }, [readings, t]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.rangeRow}>
          {RANGES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.rangeChip, range === item && styles.rangeChipActive]}
              onPress={() => setRange(item)}
            >
              <Text style={[styles.rangeText, range === item && styles.rangeTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.secondary} />
          </View>
        ) : !chartData ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t("no_history")}</Text>
          </View>
        ) : (
          <View style={styles.chartCard}>
            <LineChart
              data={chartData}
              width={width - 62}
              height={230}
              withDots={false}
              withShadow
              withInnerLines
              yAxisSuffix="%"
              chartConfig={{
                backgroundGradientFrom: Colors.card,
                backgroundGradientTo: Colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(27, 94, 66, ${opacity})`,
                labelColor: () => Colors.textLight,
                propsForBackgroundLines: { stroke: "#e6ece9" },
                propsForLabels: { fontSize: 10 },
              }}
              bezier
              style={{ marginLeft: -12, borderRadius: 14 }}
            />
          </View>
        )}

        {readings.length ? (
          <View style={styles.listCard}>
            <Text style={styles.listTitle}>{t("recent_readings")}</Text>
            {[...readings]
              .reverse()
              .slice(0, 12)
              .map((reading: any, index: number) => (
                <View key={index} style={styles.listRow}>
                  <Text style={styles.listTime}>+{index * 2}s</Text>
                  <Text style={styles.listValue}>
                    💧 {Math.round(reading.soil_moisture ?? 0)}%
                  </Text>
                  <Text style={styles.listValue}>
                    🌡️ {Number(reading.temperature ?? 0).toFixed(1)}°C
                  </Text>
                  <Text style={styles.listValue}>
                    🚰 {Math.round(reading.water_level ?? 0)}%
                  </Text>
                </View>
              ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { paddingVertical: 40, alignItems: "center" },
  rangeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  rangeChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: "#e0e8e4",
  },
  rangeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rangeText: { fontSize: 12.5, color: Colors.text },
  rangeTextActive: { color: Colors.white, fontWeight: "700" },
  chartCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 10, overflow: "hidden" },
  empty: { backgroundColor: Colors.card, borderRadius: 16, padding: 30, alignItems: "center" },
  emptyText: { fontSize: 13, color: Colors.textLight },
  listCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginTop: 18 },
  listTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, marginBottom: 10 },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f0",
  },
  listTime: { fontSize: 11.5, color: Colors.textLight },
  listValue: { fontSize: 11.5, color: Colors.text, fontWeight: "600" },
});