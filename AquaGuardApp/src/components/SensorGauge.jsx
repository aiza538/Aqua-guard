import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

export default function SensorGauge({ label, value, unit, icon }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.value}>
        {value}
        <Text style={styles.unit}>{unit}</Text>
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e3f2ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: { fontSize: 20 },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  unit: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textLight,
  },
  label: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    fontWeight: '500',
  },
});