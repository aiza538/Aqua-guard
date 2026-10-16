import { View, Text, StyleSheet, Switch } from 'react-native';
import { Colors } from '../constants/theme';

export default function ValveToggleButton({ label, value, onToggle }) {
  return (
    <View style={[styles.row, value && styles.rowActive]}>
      <View style={styles.leftContent}>
        <View style={[styles.dot, { backgroundColor: value ? Colors.accent : '#c9d4cd' }]} />
        <View>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.status, value && styles.statusActive]}>
            {value ? 'Running' : 'Stopped'}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#d0dcd6', true: Colors.accent }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowActive: {
    borderColor: '#c8e6d6',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  status: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  statusActive: {
    color: Colors.secondary,
    fontWeight: '600',
  },
});