import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../constants/theme";
import { signalQuality } from "../api/sensorApi";

function formatUptime(seconds) {
  if (typeof seconds !== "number" || seconds < 0) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatLastSeen(lastSeen, now) {
  if (!lastSeen) return "never";
  const seconds = Math.max(0, Math.round((now - lastSeen) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export default function DeviceStatusBar({ info, health, live, now }) {
  const online = health?.online !== false;
  const rssi = health?.rssi ?? live?.rssi ?? null;
  const bars = signalQuality(rssi);
  const uptime = live?.uptime_s ?? info?.uptime_s ?? null;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: online ? Colors.accent : Colors.danger }]} />
        <Text style={[styles.statusText, { color: online ? Colors.secondary : Colors.danger }]}>
          {online ? "Online" : "Offline"}
        </Text>
        <View style={styles.spacer} />
        <View style={styles.bars}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.bar,
                { height: 6 + i * 4 },
                i < bars && online ? styles.barActive : styles.barInactive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.meta}>{rssi !== null ? `${rssi} dBm` : "—"}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>⏱ {formatUptime(uptime)}</Text>
        <Text style={styles.meta}>🕒 {formatLastSeen(health?.lastSeen, now)}</Text>
        {info?.firmware ? <Text style={styles.meta}>v{info.firmware}</Text> : null}
        {info?.ip ? <Text style={styles.meta}>{info.ip}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  spacer: { flex: 1 },
  dot: { width: 9, height: 9, borderRadius: 5, marginBottom: 3 },
  statusText: { fontSize: 13, fontWeight: "700" },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 20 },
  bar: { width: 4, borderRadius: 2 },
  barActive: { backgroundColor: Colors.accent },
  barInactive: { backgroundColor: '#d3ddd7' },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  meta: { fontSize: 11, color: Colors.textLight },
});