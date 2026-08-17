import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';

export default function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <TouchableOpacity
        style={[
          styles.pill,
          compact && styles.pillCompact,
          i18n.language === 'en' && (compact ? styles.activePillCompact : styles.activePill),
        ]}
        onPress={() => changeLanguage('en')}
      >
        <Text
          style={[
            styles.text,
            compact && styles.textCompact,
            i18n.language === 'en' && styles.activeText,
          ]}
        >
          EN
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.pill,
          compact && styles.pillCompact,
          i18n.language === 'ur' && (compact ? styles.activePillCompact : styles.activePill),
        ]}
        onPress={() => changeLanguage('ur')}
      >
        <Text
          style={[
            styles.text,
            compact && styles.textCompact,
            i18n.language === 'ur' && styles.activeText,
          ]}
        >
          اردو
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 4,
    alignSelf: 'flex-start',
  },
  containerCompact: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillCompact: {
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  activePill: {
    backgroundColor: Colors.primary,
  },
  activePillCompact: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  text: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '600',
  },
  textCompact: {
    fontSize: 11,
    color: Colors.white,
  },
  activeText: {
    color: Colors.primary,
  },
});