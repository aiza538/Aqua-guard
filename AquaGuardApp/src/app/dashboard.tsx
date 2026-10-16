import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import SensorGauge from '../components/SensorGauge';
import ValveToggleButton from '../components/ValveToggleButton';
import DeviceStatusBar from '../components/DeviceStatusBar';
import { Colors } from '../constants/theme';
import { useDevices } from '../context/DeviceContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { devices, activeDevice, live, health, toggleRelay, relayBusy } = useDevices();

  const data = activeDevice ? live[activeDevice.id] : null;
  const deviceHealth = activeDevice ? health[activeDevice.id] : null;
  const relays = data?.relays || [];

  const value = (raw: unknown, digits = 0) =>
    typeof raw === 'number' ? raw.toFixed(digits) : '--';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#0d3b2e', '#1b5e42']}
          style={styles.headerCard}
        >
          <Text style={styles.greeting}>{t('welcome')} 👋</Text>
          <Text style={styles.farmName}>{activeDevice?.name || t('farm_name')}</Text>
          <View style={styles.weatherRow}>
            <Text style={styles.weatherText}>
              {data?.temperature !== undefined
                ? `🌡️ ${value(data.temperature, 1)}°C · 💧 ${value(data.humidity)}%`
                : `☀️ ${t('weather_status')}`}
            </Text>
          </View>
        </LinearGradient>

        {activeDevice ? (
          <DeviceStatusBar info={null} health={deviceHealth} live={data} now={Date.now()} />
        ) : (
          <TouchableOpacity style={styles.noDeviceCard} onPress={() => router.push('/addDevice')}>
            <Text style={styles.noDeviceIcon}>📡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.noDeviceTitle}>{t('no_device_connected')}</Text>
              <Text style={styles.noDeviceSubtitle}>{t('no_device_subtitle')}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}

        <View style={styles.gaugeRow}>
          <SensorGauge label={t('soil_moisture')} value={value(data?.soil_moisture)} unit="%" icon="🌱" />
          <SensorGauge label={t('temperature')} value={value(data?.temperature, 1)} unit="°C" icon="🌡️" />
          <SensorGauge label={t('humidity')} value={value(data?.humidity)} unit="%" icon="💧" />
          <SensorGauge label={t('water_level')} value={value(data?.water_level)} unit="%" icon="🚰" />
        </View>

        <Text style={styles.sectionTitle}>{t('irrigation_control')}</Text>
        <ValveToggleButton
          label={t('drip_irrigation')}
          value={!!relays[0]}
          onToggle={() => activeDevice && toggleRelay(activeDevice.id, 0, !relays[0])}
        />
        <ValveToggleButton
          label={t('sprinkler_system')}
          value={!!relays[1]}
          onToggle={() => activeDevice && toggleRelay(activeDevice.id, 1, !relays[1])}
        />
        {relayBusy ? <Text style={styles.busyText}>{t('sending_command')}</Text> : null}

        <Text style={styles.sectionTitle}>{t('quick_actions')}</Text>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.85}
          onPress={() => router.push('/devices')}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#e3f2ea' }]}>
            <Text style={styles.actionIcon}>📡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>{t('my_devices')}</Text>
            <Text style={styles.actionSubtitle}>{t('my_devices_subtitle')}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.85}
          onPress={() => router.push('/irrigationControl')}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#e3f2ea' }]}>
            <Text style={styles.actionIcon}>⚙️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>{t('advanced_settings')}</Text>
            <Text style={styles.actionSubtitle}>{t('advanced_settings_subtitle')}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.85}
          onPress={() => router.push('/diseaseScanner')}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#e3f2ea' }]}>
            <Text style={styles.actionIcon}>🔍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>{t('scan_disease')}</Text>
            <Text style={styles.actionSubtitle}>{t('scan_disease_subtitle')}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {devices.length > 1 ? (
          <Text style={styles.multiHint}>{t('multi_device_hint')}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  headerCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  farmName: { fontSize: 24, fontWeight: '800', color: Colors.white, marginTop: 4 },
  weatherRow: { marginTop: 14 },
  weatherText: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  noDeviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf6e3',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  noDeviceIcon: { fontSize: 24, marginRight: 12 },
  noDeviceTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  noDeviceSubtitle: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  gaugeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 26,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 4,
  },
  busyText: { fontSize: 11.5, color: Colors.textLight, marginTop: -4, marginBottom: 8 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionIcon: { fontSize: 22 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  actionSubtitle: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  arrow: { fontSize: 26, color: Colors.textLight },
  multiHint: {
    fontSize: 11.5,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 18,
  },
});