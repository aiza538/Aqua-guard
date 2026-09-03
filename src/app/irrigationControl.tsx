import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';
import ValveToggleButton from '../components/ValveToggleButton';
import { getDistrictsAndSoilTypes, predictIrrigation } from '../api/irrigationApi';

// Backend se aane wale raw naam (jaise "DI Khan") ko JSON key ("di_khan") mein convert karta hai
const toKey = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '');

export default function IrrigationControlScreen() {
  const { t } = useTranslation();
  const [autoMode, setAutoMode] = useState(true);
  const [drip, setDrip] = useState(false);
  const [sprinkler, setSprinkler] = useState(false);

  const [districts, setDistricts] = useState<string[]>([]);
  const [soilTypes, setSoilTypes] = useState<string[]>([]);
  const [cropTypes, setCropTypes] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSoilType, setSelectedSoilType] = useState('');
  const [selectedCropType, setSelectedCropType] = useState('');
  const [soilPh, setSoilPh] = useState('');
  const [moisture, setMoisture] = useState('');
  const [rainfall, setRainfall] = useState('');
  const [areaAcres, setAreaAcres] = useState('');
  const [result, setResult] = useState<{
    recommended_irrigation_liters: number;
    needs_water: boolean;
    canal_access: string;
    water_source_note: string;
    crop_type?: string;
    area_acres?: number;
    kc_factor?: number;
    liters_per_acre?: number;
    total_liters_required?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getDistrictsAndSoilTypes()
      .then((data) => {
        setDistricts(data.districts);
        setSoilTypes(data.soil_types);
        setCropTypes(data.crop_types || []);
      })
      .catch(() => setError('Could not load options.'));
  }, []);

  const handlePredict = async () => {
    setError('');
    setResult(null);

    if (!selectedDistrict || !selectedSoilType || !soilPh || !moisture || !rainfall || !selectedCropType || !areaAcres) {
      setError('Please fill all fields to get a prediction.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const data = await predictIrrigation(
        {
          district: selectedDistrict,
          soil_type: selectedSoilType,
          soil_ph: parseFloat(soilPh),
          moisture: parseFloat(moisture),
          rainfall: parseFloat(rainfall),
          crop_type: selectedCropType,
          area_acres: parseFloat(areaAcres),
        },
        token
      );
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

        <Text style={styles.sectionTitle}>{t('smart_irrigation_prediction')}</Text>
        <View style={styles.predictCard}>
          <Text style={styles.fieldLabel}>{t('district')}</Text>
          <View style={styles.chipRow}>
            {districts.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, selectedDistrict === d && styles.chipActive]}
                onPress={() => setSelectedDistrict(d)}
              >
                <Text style={[styles.chipText, selectedDistrict === d && styles.chipTextActive]}>
                  {t(`districts.${toKey(d)}`, { defaultValue: d })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>{t('soil_type')}</Text>
          <View style={styles.chipRow}>
            {soilTypes.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, selectedSoilType === s && styles.chipActive]}
                onPress={() => setSelectedSoilType(s)}
              >
                <Text style={[styles.chipText, selectedSoilType === s && styles.chipTextActive]}>
                  {t(`soil_types.${toKey(s)}`, { defaultValue: s })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>{t('crop_type')}</Text>
          <View style={styles.chipRow}>
            {cropTypes.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, selectedCropType === c && styles.chipActive]}
                onPress={() => setSelectedCropType(c)}
              >
                <Text style={[styles.chipText, selectedCropType === c && styles.chipTextActive]}>
                  {t(`crop_types.${toKey(c)}`, { defaultValue: c })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputCol}>
              <Text style={styles.fieldLabel}>{t('soil_ph')}</Text>
              <TextInput
                style={styles.numInput}
                placeholder="e.g. 6.8"
                keyboardType="decimal-pad"
                value={soilPh}
                onChangeText={setSoilPh}
              />
            </View>
            <View style={styles.inputCol}>
              <Text style={styles.fieldLabel}>{t('moisture_percent')}</Text>
              <TextInput
                style={styles.numInput}
                placeholder="e.g. 20"
                keyboardType="decimal-pad"
                value={moisture}
                onChangeText={setMoisture}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputCol}>
              <Text style={styles.fieldLabel}>{t('rainfall_mm')}</Text>
              <TextInput
                style={styles.numInput}
                placeholder="e.g. 50"
                keyboardType="decimal-pad"
                value={rainfall}
                onChangeText={setRainfall}
              />
            </View>
            <View style={styles.inputCol}>
              <Text style={styles.fieldLabel}>{t('land_area_acres')}</Text>
              <TextInput
                style={styles.numInput}
                placeholder="e.g. 2.5"
                keyboardType="decimal-pad"
                value={areaAcres}
                onChangeText={setAreaAcres}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

          <TouchableOpacity style={styles.predictButton} onPress={handlePredict} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.predictButtonText}>{t('get_prediction')}</Text>
            )}
          </TouchableOpacity>

          {result && (
            <View style={styles.resultBox}>
              <Text style={styles.resultLiters}>
                {(result.total_liters_required ?? result.recommended_irrigation_liters).toLocaleString()} L
              </Text>
              <Text style={styles.resultLabel}>
                {t('water_requirement')}
                {result.area_acres ? ` (${result.area_acres} acre${result.area_acres > 1 ? 's' : ''})` : ''}
              </Text>

              <View style={[styles.badge, { backgroundColor: result.needs_water ? '#fdecea' : '#e3f2ea' }]}>
                <Text style={[styles.badgeText, { color: result.needs_water ? Colors.danger : Colors.secondary }]}>
                  {result.needs_water ? '💧 Needs Water' : '✅ No Water Needed'}
                </Text>
              </View>

              {(result.crop_type || result.kc_factor || result.liters_per_acre) && (
                <View style={styles.breakdownRow}>
                  {result.crop_type ? (
                    <Text style={styles.breakdownText}>
                      🌾 {t(`crop_types.${toKey(result.crop_type)}`, { defaultValue: result.crop_type })}
                    </Text>
                  ) : null}
                  {result.kc_factor ? (
                    <Text style={styles.breakdownText}>Kc: {result.kc_factor}</Text>
                  ) : null}
                  {result.liters_per_acre ? (
                    <Text style={styles.breakdownText}>{result.liters_per_acre.toLocaleString()} L/acre</Text>
                  ) : null}
                </View>
              )}

              {result.water_source_note ? (
                <View style={styles.waterSourceBox}>
                  <Text style={styles.waterSourceIcon}>
                    {result.canal_access === 'Yes' ? '🚰' : '⚠️'}
                  </Text>
                  <Text style={styles.waterSourceText}>{result.water_source_note}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

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
  modeCard: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, marginBottom: 20 },
  modeTitle: { color: Colors.white, fontWeight: '600', fontSize: 14, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 10 },
  scheduleCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 16 },
  scheduleText: { fontSize: 14, color: Colors.text, marginBottom: 8 },
  saveButton: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveButtonText: { color: Colors.white, fontWeight: '600', fontSize: 15 },

  predictCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textLight, marginBottom: 8, marginTop: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#e0e8e4',
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12.5, color: Colors.text },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputCol: { flex: 1 },
  numInput: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: '#e0e8e4',
  },
  errorText: { color: Colors.danger, fontSize: 12.5, marginTop: 12 },
  predictButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
  },
  predictButtonText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  resultBox: {
    marginTop: 18,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 18,
  },
  resultLiters: { fontSize: 30, fontWeight: '800', color: Colors.primary },
  resultLabel: { fontSize: 12, color: Colors.textLight, marginTop: 2, marginBottom: 10 },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  badgeText: { fontSize: 12.5, fontWeight: '600' },
  breakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  breakdownText: {
    fontSize: 11.5,
    color: Colors.textLight,
    backgroundColor: Colors.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  waterSourceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    backgroundColor: '#fdf6e3',
    borderRadius: 10,
    padding: 12,
    width: '100%',
  },
  waterSourceIcon: { fontSize: 16 },
  waterSourceText: { flex: 1, fontSize: 12, color: Colors.text, lineHeight: 17 },
});