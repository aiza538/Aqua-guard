import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

export default function AutoIrrigationCard({ config, latestMoisture }) {
  const moisture = latestMoisture || 0;
  const low = config?.moisture_threshold_low || 30;
  const high = config?.moisture_threshold_high || 60;

  let statusText = 'Moisture OK — No watering needed';
  let statusColor = Colors.accent;

  if (moisture < low) {
    statusText = '⚠️ Moisture LOW — Auto watering will activate';
    statusColor = Colors.danger;
  } else if (moisture > high) {
    statusText = '✅ Moisture HIGH — Pump will stop';
    statusColor = Colors.accent;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🤖 Auto Irrigation Logic</Text>
      <View style={styles.thresholdRow}>
        <View style={styles.threshold}>
          <Text style={styles.thLabel}>Start Below</Text>
          <Text style={[styles.thValue, { color: Colors.danger }]}>{low}%</Text>
        </View>
        <View style={styles.threshold}>
          <Text style={styles.thLabel}>Current</Text>
          <Text style={[styles.thValue, { color: statusColor }]}>
            {Math.round(moisture)}%
          </Text>
        </View>
        <View style={styles.threshold}>
          <Text style={styles.thLabel}>Stop Above</Text>
          <Text style={[styles.thValue, { color: Colors.accent }]}>{high}%</Text>
        </View>
      </View>
      <View style={[styles.statusBar, { backgroundColor: statusColor + '22' }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  thresholdRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  threshold: { alignItems: 'center' },
  thLabel: { fontSize: 11, color: Colors.textLight, marginBottom: 4 },
  thValue: { fontSize: 22, fontWeight: '800' },
  statusBar: { borderRadius: 10, padding: 12, alignItems: 'center' },
  statusText: { fontSize: 13, fontWeight: '600' },
});
