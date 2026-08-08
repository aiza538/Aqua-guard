import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>💧 AquaGuard</Text>
      <Text style={styles.subtitle}>App is running successfully!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f5f9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0077b6',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
  },
});