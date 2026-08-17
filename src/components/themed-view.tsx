import { View, ViewProps, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

export function ThemedView({ style, ...rest }: ViewProps) {
  return <View style={[styles.default, style]} {...rest} />;
}

const styles = StyleSheet.create({
  default: { backgroundColor: Colors.background },
});