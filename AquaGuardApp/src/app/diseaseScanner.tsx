import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/theme';

type DiagnosisResult = {
  disease: string;
  confidence: string;
  treatment: string;
};

export default function DiseaseScannerScreen() {
  const { t } = useTranslation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImageFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to scan leaves.');
      return;
    }
    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    });
    handlePickedImage(pickerResult);
  };

  const pickImageFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Gallery access is needed to select a photo.');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    });
    handlePickedImage(pickerResult);
  };

  const handlePickedImage = async (pickerResult: ImagePicker.ImagePickerResult) => {
    if (pickerResult.canceled || !pickerResult.assets?.[0]) return;

    const asset = pickerResult.assets[0];
    setImageUri(asset.uri);
    setResult(null);
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setResult({
        disease: 'Early Blight',
        confidence: '92%',
        treatment: 'Apply copper-based fungicide, remove affected leaves.',
      });
    } catch (error: any) {
      Alert.alert('Scan Failed', error.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageBox}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={styles.placeholderText}>🍃{'\n'}{t('no_image_selected')}</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.captureButton} onPress={pickImageFromCamera}>
          <Text style={styles.captureButtonText}>📷 {t('take_photo')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.galleryButton} onPress={pickImageFromGallery}>
          <Text style={styles.galleryButtonText}>🖼️ {t('gallery')}</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('analyzing')}</Text>
        </View>
      )}

      {result && !loading && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{t('diagnosis_result')}</Text>
          <Text style={styles.resultDisease}>{result.disease}</Text>
          <Text style={styles.resultConfidence}>{t('confidence')}: {result.confidence}</Text>
          <Text style={styles.resultLabel}>{t('recommended_treatment')}:</Text>
          <Text style={styles.resultTreatment}>{result.treatment}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  imageBox: {
    height: 260,
    backgroundColor: Colors.card,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e8e4',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  placeholderText: { textAlign: 'center', color: Colors.textLight, fontSize: 15 },
  image: { width: '100%', height: '100%' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  captureButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  captureButtonText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  galleryButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  galleryButtonText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  loadingBox: { alignItems: 'center', marginTop: 24 },
  loadingText: { color: Colors.textLight, marginTop: 10, fontSize: 13 },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  resultTitle: { fontSize: 13, color: Colors.textLight, marginBottom: 4 },
  resultDisease: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  resultConfidence: { fontSize: 13, color: Colors.textLight, marginTop: 2, marginBottom: 12 },
  resultLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  resultTreatment: { fontSize: 14, color: Colors.text, marginTop: 4, lineHeight: 20 },
});