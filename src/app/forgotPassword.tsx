import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = () => {
    setError('');
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }
    // TODO: Backend OTP/reset API call
    setSent(true);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0d3b2e', '#1b5e42', '#2e7d55']} style={styles.heroSection}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <LanguageSwitcher compact />
        </View>

        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🔑</Text>
        </View>
        <Text style={styles.appName}>{t('reset_password')}</Text>
        <Text style={styles.tagline}>{t('reset_subtitle')}</Text>
      </LinearGradient>

      <SafeAreaView style={styles.formSection}>
        <View style={styles.formCard}>
          {sent ? (
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>{t('code_sent')}</Text>
              <Text style={styles.successText}>
                {t('code_sent_message')} {phone}.
              </Text>
              <TouchableOpacity style={styles.loginButton} onPress={() => router.back()}>
                <LinearGradient colors={['#1b5e42', '#0d3b2e']} style={styles.loginGradient}>
                  <Text style={styles.loginButtonText}>{t('back_to_login')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>{t('phone_number')}</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📱</Text>
                <TextInput
                  style={styles.input}
                  placeholder="03XX-XXXXXXX"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <TouchableOpacity style={styles.loginButton} activeOpacity={0.85} onPress={handleReset}>
                <LinearGradient colors={['#1b5e42', '#0d3b2e']} style={styles.loginGradient}>
                  <Text style={styles.loginButtonText}>{t('send_reset_code')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    paddingTop: 55,
    paddingBottom: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: { color: Colors.white, fontSize: 22, marginTop: -2 },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: { fontSize: 40 },
  appName: { fontSize: 24, fontWeight: '800', color: Colors.white },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  formSection: { flex: 1, backgroundColor: Colors.background },
  formCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginTop: -40,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  errorBox: { backgroundColor: '#fdecea', borderRadius: 10, padding: 12, marginBottom: 10 },
  errorText: { color: Colors.danger, fontSize: 12.5, fontWeight: '500' },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textLight, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e0e8e4',
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: Colors.text },
  loginButton: { marginTop: 22, borderRadius: 12, overflow: 'hidden' },
  loginGradient: { paddingVertical: 15, alignItems: 'center' },
  loginButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  successBox: { alignItems: 'center', paddingVertical: 10 },
  successIcon: { fontSize: 44, marginBottom: 10 },
  successTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  successText: { fontSize: 13, color: Colors.textLight, textAlign: 'center', lineHeight: 19, marginBottom: 6 },
});