import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { DeviceProvider } from '../context/DeviceContext';
import '../locales/i18n';

export default function RootLayout() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    router.replace('/');
  };

  return (
    <DeviceProvider>
      <Stack
        key={i18n.language}
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerTitleAlign: 'center',
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="forgotPassword" options={{ headerShown: false }} />

        <Stack.Screen
          name="dashboard"
          options={{
            title: t('app_name'),
            headerBackVisible: false,
            headerLeft: () => null,
            headerRight: () => (
              <View style={styles.headerRightRow}>
                <LanguageSwitcher compact />
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                  <Text style={styles.logoutIcon}>⏻</Text>
                </TouchableOpacity>
              </View>
            ),
          }}
        />

        <Stack.Screen name="irrigationControl" options={{ title: t('irrigation_control') }} />
        <Stack.Screen name="diseaseScanner" options={{ title: t('disease_scanner_title') }} />
        <Stack.Screen name="devices" options={{ title: t('my_devices') }} />
        <Stack.Screen name="addDevice" options={{ title: t('add_device') }} />
        <Stack.Screen name="deviceDetail" options={{ title: t('device_details') }} />
        <Stack.Screen name="history" options={{ title: t('history') }} />
      </Stack>
    </DeviceProvider>
  );
}

const styles = StyleSheet.create({
  headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoutBtn: { paddingHorizontal: 4 },
  logoutIcon: { color: Colors.white, fontSize: 18 },
});