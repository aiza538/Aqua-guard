import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');

    if (!phone.trim() || !password.trim()) {
      setError('Please enter both phone number and password.');
      return;
    }

    if (phone.trim().length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    router.push('/dashboard');
  };

  const handleForgotPassword = () => {
    setError('');

    if (!phone.trim()) {
      setError(t('fill_phone_first'));
      return;
    }

    router.push('/forgotPassword');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <LinearGradient
          colors={['#0d3b2e', '#1b5e42', '#2e7d55']}
          style={styles.heroSection}
        >
          <View style={styles.langSwitcherWrapper}>
            <LanguageSwitcher compact />
          </View>

          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>💧</Text>
          </View>
          <Text style={styles.appName}>{t('app_name')}</Text>
          <Text style={styles.tagline}>{t('app_tagline')}</Text>
        </LinearGradient>

        <SafeAreaView style={styles.formSection}>
          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>{t('welcome')} 👋</Text>
            <Text style={styles.subText}>{t('login_subtitle')}</Text>

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
              style={styles.forgotWrapper}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotText}>{t('forgot_password')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.85}
              onPress={handleLogin}
            >
              <LinearGradient
                colors={['#1b5e42', '#0d3b2e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginGradient}
              >
                <Text style={styles.loginButtonText}>{t('login')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signupText}>
                {t('no_account')} <Text style={styles.signupBold}>{t('sign_up')}</Text>
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
    paddingTop: 60,
    paddingBottom: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  langSwitcherWrapper: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginBottom: 10,
  },
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
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },
  formSection: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  subText: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#fdecea',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12.5,
    fontWeight: '500',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 6,
    marginTop: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e0e8e4',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.text,
  },
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 26,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e8e4',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: Colors.textLight,
  },
  signupText: {
    textAlign: 'center',
    color: Colors.textLight,
    marginTop: 18,
    fontSize: 13,
  },
  signupBold: {
    color: Colors.primary,
    fontWeight: '700',
  },
});