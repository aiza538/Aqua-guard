import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "../constants/theme";

function hostLabel(host) {
  return String(host || "").replace(/^https?:\/\//, "");
}

export default function DeviceCard({ device, live, health, active, onPress }) {
  const online = health?.online === true;
  const moisture = live?.soil_moisture;
  const relays = live?.relays || [];

  return (
    <TouchableOpacity
      style={[styles.card, active && styles.cardActive]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.thumb}>
        <Text style={styles.thumbIcon}>{online ? "🌿" : "⚠️"}</Text>
        <View
          style={[
            styles.onlineDot,
            { backgroundColor: online ? Colors.accent : Colors.danger },
          ]}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {device.name}
          </Text>
          {active ? <Text style={styles.activeTag}>●</Text> : null}
        </View>
        <Text style={styles.host} numberOfLines={1}>
          {hostLabel(device.host)}
        </Text>

        {online ? (
          <View style={styles.readings}>
            <Text style={styles.reading}>
              💧 {typeof moisture === "number" ? `${Math.round(moisture)}%` : "—"}
            </Text>
            <Text style={styles.reading}>
              🌡️{" "}
              {typeof live?.temperature === "number"
                ? `${live.temperature.toFixed(1)}°C`
                : "—"}
            </Text>
          </View>
        ) : (
          <Text style={styles.offlineText}>No response — check power & WiFi</Text>
        )}
      </View>

      <View style={styles.relayRow}>
        {relays.map((state, index) => (
          <View
            key={index}
            style={[styles.relayPill, state ? styles.relayPillOn : styles.relayPillOff]}
          >
            <Text style={styles.relayPillText}>{index === 0 ? "Drip" : "Spray"}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardActive: { borderColor: Colors.accent },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#e3f2ea",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  thumbIcon: { fontSize: 24 },
  onlineDot: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  body: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 15, fontWeight: "700", color: Colors.text, flexShrink: 1 },
  activeTag: { color: Colors.accent, fontSize: 10 },
  host: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  readings: { flexDirection: "row", gap: 10, marginTop: 6 },
  reading: { fontSize: 12, color: Colors.text, fontWeight: "600" },
  offlineText: { fontSize: 11.5, color: Colors.danger, marginTop: 6 },
  relayRow: { gap: 6, marginLeft: 10 },
  relayPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  relayPillOn: { backgroundColor: "#e3f2ea" },
  relayPillOff: { backgroundColor: "#eef2f0" },
  relayPillText: { fontSize: 9.5, color: Colors.textLight, fontWeight: "600" },
});