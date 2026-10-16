import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, RefreshControl, TextInput, Modal,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import SensorGauge from '../components/SensorGauge';
import WaterLevelIndicator from '../components/WaterLevelIndicator';
import PumpStatusCard from '../components/PumpStatusCard';
import AiAdvisorCard from '../components/AiAdvisorCard';
import { Colors } from '../constants/theme';
import { getLatestReading } from '../api/sensorApi';
import { getIrrigationStatus } from '../api/irrigationApi';
import { getAiInsights } from '../api/aiApi';

export default function DashboardScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  // Plant Name State (Customizable by user)
  const [plantName, setPlantName] = useState(isUrdu ? 'میرا سمارٹ پودا 🌱' : 'My Smart Plant 🌱');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(plantName);

  const [sensor, setSensor] = useState({
    temperature: 0,
    soil_moisture: 0,
    humidity: 0,
    water_level: 0,
    connected: false,
    timestamp: null,
    last_seen_seconds: null,
  });
  const [irrigation, setIrrigation] = useState({
    config: { auto_mode: true, pump_on: false },
    recent_logs: [],
  });
  const [aiData, setAiData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [sensorRes, irrigRes, aiRes] = await Promise.all([
        getLatestReading(),
        getIrrigationStatus(),
        getAiInsights(i18n.language),
      ]);
      setSensor(sensorRes.data);
      setIrrigation(irrigRes.data);
      setAiData(aiRes.data);
      setLastUpdate(new Date());
    } catch (_) {}
  }, [i18n.language]);

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

  const handleAiRefresh = async () => {
    setAiLoading(true);
    try {
      const res = await getAiInsights(i18n.language);
      setAiData(res.data);
    } catch (_) {}
    setAiLoading(false);
  };

  const handleSavePlantName = () => {
    if (tempName.trim()) {
      setPlantName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const isContainerEmpty = (sensor.water_level || 0) <= 10;
  const pumpOn = irrigation.config?.pump_on || false;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Header Card with Customizable Plant Name & Inspiring Text */}
        <LinearGradient colors={['#07271d', '#0f4834']} style={styles.headerCard}>
          <View style={[styles.headerTopRow, isUrdu && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.tagline}>{t('app_branding_tag')}</Text>
            {lastUpdate && (
              <Text style={styles.liveIndicator}>
                ● {t('live')} {lastUpdate.toLocaleTimeString()}
              </Text>
            )}
          </View>

          {/* Plant Name with Edit Button */}
          <TouchableOpacity
            style={[styles.plantNameRow, isUrdu && { flexDirection: 'row-reverse' }]}
            activeOpacity={0.8}
            onPress={() => {
              setTempName(plantName);
              setIsEditingName(true);
            }}
          >
            <Text style={[styles.plantName, isUrdu && styles.textRight]}>
              {plantName}
            </Text>
            <View style={styles.editPencilBadge}>
              <Text style={styles.editPencilText}>✎ {isUrdu ? 'ترمیم' : 'Edit'}</Text>
            </View>
          </TouchableOpacity>

          <Text style={[styles.mottoText, isUrdu && styles.textRight]}>
            {t('motto_text')}
          </Text>

          <View style={styles.weatherRow}>
            <Text style={[styles.weatherText, isUrdu && styles.textRight]}>
              🌡️ {Math.round(sensor.temperature)}°C · 💧 {Math.round(sensor.humidity)}% {t('humidity')} · 🌿 {t('soil_moisture')}: {Math.round(sensor.soil_moisture)}%
            </Text>
          </View>
        </LinearGradient>

        {/* URGENT WARNING: Fill Water in Container (When water_level <= 10) */}
        {isContainerEmpty && (
          <View style={[styles.urgentAlertCard, isUrdu && { flexDirection: 'row-reverse' }]}>
            <View style={styles.alertIconBox}>
              <Text style={styles.alertIconText}>🚨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.urgentAlertTitle, isUrdu && styles.textRight]}>
                {t('urgent_container_alert_title')}
              </Text>
              <Text style={[styles.urgentAlertDesc, isUrdu && styles.textRight]}>
                {t('urgent_container_alert_desc')}
              </Text>
            </View>
          </View>
        )}

        {/* Microcontroller Connection Status Banner */}
        <View style={[
          styles.connBadge,
          sensor.connected ? styles.connBadgeOnline : styles.connBadgeOffline,
          isUrdu && { flexDirection: 'row-reverse' },
        ]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: sensor.connected ? '#10b981' : '#ef4444' }
          ]} />
          <View style={{ flex: 1 }}>
            <Text style={[
              styles.connTitle,
              { color: sensor.connected ? '#065f46' : '#991b1b' },
              isUrdu && styles.textRight,
            ]}>
              {sensor.connected
                ? t('microcontroller_connected')
                : t('microcontroller_disconnected')}
            </Text>
            <Text style={[
              styles.connSubtitle,
              { color: sensor.connected ? '#047857' : '#b91c1c' },
              isUrdu && styles.textRight,
            ]}>
              {sensor.connected
                ? (isUrdu
                    ? `لائیو ٹیلی میٹری فعال ہے · آخری پیکٹ ${sensor.last_seen_seconds ?? 0} سیکنڈ قبل`
                    : `Real-time sensor telemetry streaming · Last packet ${sensor.last_seen_seconds ?? 0}s ago`)
                : (sensor.timestamp
                    ? (isUrdu
                        ? `کنکشن عارضی بند (آخری ڈیٹا ${sensor.last_seen_seconds} سیکنڈ قبل)`
                        : `Telemetry paused (Last seen ${sensor.last_seen_seconds}s ago)`)
                    : (isUrdu ? 'کنٹرولر سے ڈیٹا کا انتظار...' : 'Awaiting sensor packet from ESP32...'))}
            </Text>
          </View>
        </View>

        {/* AI AGRONOMIC INTELLIGENCE ENGINE */}
        <AiAdvisorCard
          aiData={aiData}
          onRefresh={handleAiRefresh}
          loading={aiLoading}
        />

        {/* Sensor Telemetry Gauges */}
        <Text style={[styles.sectionTitle, isUrdu && styles.textRight]}>
          🌱 {t('live_sensor_readings')}
        </Text>
        <View style={styles.gaugeRow}>
          <SensorGauge
            label={t('soil_moisture')}
            value={Math.round(sensor.soil_moisture).toString()}
            unit="%"
            icon="🌱"
          />
          <SensorGauge
            label={t('temperature')}
            value={Math.round(sensor.temperature).toString()}
            unit="°C"
            icon="🌡️"
          />
          <SensorGauge
            label={t('humidity')}
            value={Math.round(sensor.humidity).toString()}
            unit="%"
            icon="💧"
          />
          <SensorGauge
            label={t('container_water')}
            value={Math.round(sensor.water_level).toString()}
            unit="%"
            icon="🚰"
          />
        </View>

        {/* Container Water Supply Indicator */}
        <WaterLevelIndicator level={sensor.water_level} />

        <View style={{ height: 20 }} />

        {/* Automated Water Pump Controller */}
        <Text style={[styles.sectionTitle, isUrdu && styles.textRight]}>
          💦 {t('smart_pump_status')}
        </Text>
        <PumpStatusCard
          pumpOn={pumpOn}
          containerEmpty={isContainerEmpty}
        />

        {/* Quick Settings Action */}
        <Text style={[styles.sectionTitle, isUrdu && styles.textRight]}>
          ⚙️ {t('irrigation_config')}
        </Text>

        <TouchableOpacity
          style={[styles.actionCard, isUrdu && { flexDirection: 'row-reverse' }]}
          activeOpacity={0.85}
          onPress={() => router.push('/irrigationControl')}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#e3f2ea' }]}>
            <Text style={styles.actionIcon}>⚙️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionTitle, isUrdu && styles.textRight]}>
              {t('automation_settings_title')}
            </Text>
            <Text style={[styles.actionSubtitle, isUrdu && styles.textRight]}>
              {t('automation_settings_sub')}
            </Text>
          </View>
          <Text style={styles.arrow}>{isUrdu ? '‹' : '›'}</Text>
        </TouchableOpacity>

        {/* Recent Irrigation Activity Logs */}
        {irrigation.recent_logs?.length > 0 && (
          <View style={styles.logsSection}>
            <Text style={[styles.sectionTitle, isUrdu && styles.textRight]}>
              📜 {t('automated_irrigation_log')}
            </Text>
            {irrigation.recent_logs.slice(0, 5).map((log, i) => (
              <View key={i} style={[styles.logItem, isUrdu && { flexDirection: 'row-reverse' }]}>
                <Text style={styles.logIcon}>
                  {log.action === 'pump_on' ? '💦' : '🛑'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.logText, isUrdu && styles.textRight]}>
                    {log.action === 'pump_on' ? t('watering_activated') : t('watering_completed')}
                    {' · '}
                    {t('autonomous_ai')}
                  </Text>
                  <Text style={[styles.logTime, isUrdu && styles.textRight]}>
                    {t('soil_moisture')}: {log.soil_moisture_at_time?.toFixed(1)}% · {new Date(log.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal for Editing Plant Name */}
      <Modal
        visible={isEditingName}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingName(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, isUrdu && styles.textRight]}>
              🌿 {t('name_your_plant')}
            </Text>
            <Text style={[styles.modalSub, isUrdu && styles.textRight]}>
              {t('name_plant_sub')}
            </Text>
            <TextInput
              style={[styles.modalInput, isUrdu && styles.textRight]}
              value={tempName}
              onChangeText={setTempName}
              placeholder={isUrdu ? 'مثال: میرا ٹماٹر کا پودا 🍅' : 'e.g. My Tomato Plant 🍅'}
              placeholderTextColor="#9ca3af"
              autoFocus
            />
            <View style={[styles.modalBtnRow, isUrdu && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditingName(false)}
              >
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSavePlantName}
              >
                <Text style={styles.modalSaveText}>{t('save_name')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  headerCard: { borderRadius: 22, padding: 22, marginBottom: 18 },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.8,
  },
  liveIndicator: {
    fontSize: 11,
    color: '#a7f3d0',
    fontWeight: '700',
  },
  plantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    marginBottom: 6,
  },
  plantName: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.white,
  },
  editPencilBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  editPencilText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  mottoText: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  weatherRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 10,
  },
  weatherText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '500',
  },
  urgentAlertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    gap: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIconText: {
    fontSize: 20,
  },
  urgentAlertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991b1b',
    marginBottom: 4,
  },
  urgentAlertDesc: {
    fontSize: 12.5,
    color: '#7f1d1d',
    lineHeight: 18,
  },
  connBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1.5,
  },
  connBadgeOnline: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  connBadgeOffline: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  connTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  connSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  textRight: { textAlign: 'right' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 6,
  },
  gaugeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionIcon: { fontSize: 20 },
  actionTitle: { fontSize: 14.5, fontWeight: '700', color: Colors.text },
  actionSubtitle: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  arrow: { fontSize: 24, color: Colors.textLight },
  logsSection: { marginTop: 10 },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  logIcon: { fontSize: 22 },
  logText: { fontSize: 13.5, fontWeight: '700', color: Colors.text },
  logTime: { fontSize: 11.5, color: Colors.textLight, marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: '#f9fafb',
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  modalSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});