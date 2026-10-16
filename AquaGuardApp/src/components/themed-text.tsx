import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'link';
};

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
  return (
    <Text
      style={[
        styles.default,
        type === 'title' && styles.title,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: { fontSize: 15, color: Colors.text },
  title: { fontSize: 26, fontWeight: 'bold', color: Colors.primary },
  subtitle: { fontSize: 16, fontWeight: '600', color: Colors.secondary },
  link: { fontSize: 15, color: Colors.accent, textDecorationLine: 'underline' },
});