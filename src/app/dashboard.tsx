import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import SensorGauge from '../components/SensorGauge';
import ValveToggleButton from '../components/ValveToggleButton';
import { Colors } from '../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [dripOn, setDripOn] = useState(false);
  const [sprinklerOn, setSprinklerOn] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#0d3b2e', '#1b5e42']}
          style={styles.headerCard}
        >
          <Text style={styles.greeting}>{t('welcome')} 👋</Text>
          <Text style={styles.farmName}>Green Valley Farm</Text>
          <View style={styles.weatherRow}>
            <Text style={styles.weatherText}>☀️ 29°C · Sunny · Good day for irrigation</Text>
          </View>
        </LinearGradient>

        <View style={styles.gaugeRow}>
          <SensorGauge label={t('soil_moisture')} value="42" unit="%" icon="🌱" />
          <SensorGauge label={t('temperature')} value="29" unit="°C" icon="🌡️" />
          <SensorGauge label={t('humidity')} value="61" unit="%" icon="💧" />
          <SensorGauge label={t('water_level')} value="78" unit="%" icon="🚰" />
        </View>

        <Text style={styles.sectionTitle}>{t('irrigation_control')}</Text>
        <ValveToggleButton label={t('drip_irrigation')} value={dripOn} onToggle={setDripOn} />
        <ValveToggleButton label={t('sprinkler_system')} value={sprinklerOn} onToggle={setSprinklerOn} />

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.85}
          onPress={() => router.push('/irrigationControl')}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#e3f2ea' }]}>
            <Text style={styles.actionIcon}>⚙️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Advanced Irrigation Settings</Text>
            <Text style={styles.actionSubtitle}>Schedule, automate & fine-tune</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.85}
          onPress={() => router.push('/diseaseScanner')}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#fdf1e3' }]}>
            <Text style={styles.actionIcon}>🔬</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>{t('scan_disease')}</Text>
            <Text style={styles.actionSubtitle}>Take a photo of the leaf</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
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
    marginBottom: 24,
  },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  farmName: { fontSize: 24, fontWeight: '800', color: Colors.white, marginTop: 4 },
  weatherRow: { marginTop: 14 },
  weatherText: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  gaugeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 26,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 4,
  },
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
});