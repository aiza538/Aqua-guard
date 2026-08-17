import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import ValveToggleButton from '../components/ValveToggleButton';

export default function IrrigationControlScreen() {
  const { t } = useTranslation();
  const [autoMode, setAutoMode] = useState(true);
  const [drip, setDrip] = useState(false);
  const [sprinkler, setSprinkler] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.modeCard}>
          <Text style={styles.modeTitle}>{t('automation_mode')}</Text>
          <ValveToggleButton label={t('auto_mode')} value={autoMode} onToggle={setAutoMode} />
        </View>

        <Text style={styles.sectionTitle}>{t('manual_controls')}</Text>
        <ValveToggleButton label={t('drip_irrigation')} value={drip} onToggle={setDrip} />
        <ValveToggleButton label={t('sprinkler_system')} value={sprinkler} onToggle={setSprinkler} />

        <Text style={styles.sectionTitle}>{t('schedule')}</Text>
        <View style={styles.scheduleCard}>
          <Text style={styles.scheduleText}>🕐 {t('morning_schedule')}</Text>
          <Text style={styles.scheduleText}>🕐 {t('evening_schedule')}</Text>
        </View>

        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{t('save_settings')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  modeCard: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  modeTitle: { color: Colors.white, fontWeight: '600', fontSize: 14, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 10 },
  scheduleCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  scheduleText: { fontSize: 14, color: Colors.text, marginBottom: 8 },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
});