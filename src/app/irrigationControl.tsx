import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import ValveToggleButton from '../components/ValveToggleButton';
import PumpStatusCard from '../components/PumpStatusCard';
import AutoIrrigationCard from '../components/AutoIrrigationCard';
import { getIrrigationStatus, updateIrrigationConfig, togglePump } from '../api/irrigationApi';
import { getLatestReading } from '../api/sensorApi';

export default function IrrigationControlScreen() {
  const { t } = useTranslation();

  const [config, setConfig] = useState({
    auto_mode: true,
    pump_on: false,
    moisture_threshold_low: 30,
    moisture_threshold_high: 60,
  });
  const [sensor, setSensor] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pumpLoading, setPumpLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [irrigRes, sensorRes] = await Promise.all([
        getIrrigationStatus(),
        getLatestReading(),
      ]);
      setConfig(irrigRes.data.config);
      setSensor(sensorRes.data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleAutoModeToggle = async (val) => {
    try {
      const res = await updateIrrigationConfig({ auto_mode: val });
      setConfig(res.data);
    } catch (_) {}
  };

  const handlePumpToggle = async () => {
    setPumpLoading(true);
    try {
      await togglePump(!config.pump_on);
      await fetchData();
    } catch (_) {}
    setPumpLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Auto Mode Toggle */}
        <View style={styles.modeCard}>
          <Text style={styles.modeTitle}>{t('automation_mode')}</Text>
          <ValveToggleButton
            label={t('auto_mode')}
            value={config.auto_mode}
            onToggle={handleAutoModeToggle}
          />
        </View>

        {/* Auto Irrigation Logic Visualizer */}
        <AutoIrrigationCard
          config={config}
          latestMoisture={sensor?.soil_moisture}
        />

        {/* Automated Pump Control */}
        <Text style={styles.sectionTitle}>Automated Pump Status</Text>
        <PumpStatusCard
          pumpOn={config.pump_on}
          containerEmpty={(sensor?.water_level || 0) <= 10}
        />

        {/* How it works */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>⚡ How Auto Irrigation Works</Text>
          <Text style={styles.infoText}>
            • Soil moisture below {config.moisture_threshold_low}% → pump turns ON automatically
          </Text>
          <Text style={styles.infoText}>
            • Soil moisture above {config.moisture_threshold_high}% → pump turns OFF
          </Text>
          <Text style={styles.infoText}>
            • Water tank below 10% → pump stops (dry-run protection)
          </Text>
          <Text style={styles.infoText}>
            • Manual START/STOP always overrides auto mode
          </Text>
        </View>
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
  modeTitle: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 18,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 6,
    lineHeight: 20,
  },
});