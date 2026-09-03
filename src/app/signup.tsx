import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { signup as signupApi } from '../api/authApi';

export default function SignupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError('');

    if (!name.trim() || !phone.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await signupApi(name.trim(), phone.trim(), password);
      await AsyncStorage.setItem('authToken', data.access_token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <LinearGradient colors={['#0d3b2e', '#1b5e42', '#2e7d55']} style={styles.heroSection}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
            <LanguageSwitcher compact />
          </View>

          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🌱</Text>
          </View>
          <Text style={styles.appName}>{t('create_account')}</Text>
          <Text style={styles.tagline}>{t('join_today')}</Text>
        </LinearGradient>

        <SafeAreaView style={styles.formSection}>
          <View style={styles.formCard}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>{t('full_name')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={Colors.textLight}
                value={name}
                onChangeText={setName}
              />
            </View>

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

            <Text style={styles.label}>{t('password')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textLight}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.85}
              onPress={handleSignup}
              disabled={loading}
            >
              <LinearGradient
                colors={['#1b5e42', '#0d3b2e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginGradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.loginButtonText}>{t('create_account')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.signupText}>
                {t('have_account')} <Text style={styles.signupBold}>{t('login')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScrollView>
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
  appName: { fontSize: 26, fontWeight: '800', color: Colors.white },
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
  label: { fontSize: 12, fontWeight: '600', color: Colors.textLight, marginBottom: 6, marginTop: 14 },
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
  loginButton: { marginTop: 26, borderRadius: 12, overflow: 'hidden' },
  loginGradient: { paddingVertical: 15, alignItems: 'center' },
  loginButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  signupText: { textAlign: 'center', color: Colors.textLight, marginTop: 20, fontSize: 13 },
  signupBold: { color: Colors.primary, fontWeight: '700' },
});