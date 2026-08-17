import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// Web par hydration issue avoid karne ke liye
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}