import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import LanguageSwitcher from '../components/LanguageSwitcher';
import '../locales/i18n';

export default function RootLayout() {
  const router = useRouter();

  const handleLogout = () => {
    // TODO: AuthContext se logout() call karein jab backend ready ho
    router.replace('/');
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgotPassword" options={{ headerShown: false }} />

      <Stack.Screen
        name="dashboard"
        options={{
          title: 'AquaGuard',
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

      <Stack.Screen name="irrigationControl" options={{ title: 'Irrigation Control' }} />
      <Stack.Screen name="diseaseScanner" options={{ title: 'Disease Scanner' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutBtn: {
    paddingHorizontal: 4,
  },
  logoutIcon: {
    color: Colors.white,
    fontSize: 18,
  },
});