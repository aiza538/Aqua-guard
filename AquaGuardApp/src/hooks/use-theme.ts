import { Colors } from '../constants/theme';
import { useColorScheme } from './use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  // Filhal hum sirf light/green theme use kar rahe hain
  return {
    colors: Colors,
    scheme: scheme ?? 'light',
  };
}