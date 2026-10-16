import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';

export default function PumpStatusCard({ pumpOn, containerEmpty }) {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  let cardStyle = styles.card;
  let icon = '🌱';
  let title = t('pump_idle_title');
  let subtitle = t('pump_idle_desc');
  let badgeText = t('automated_standby');
  let badgeColor = Colors.primary;

  if (containerEmpty) {
    cardStyle = [styles.card, styles.cardBlocked];
    icon = '🛡️';
    title = t('pump_locked_title');
    subtitle = t('pump_locked_desc');
    badgeText = t('refill_needed');
    badgeColor = Colors.danger;
  } else if (pumpOn) {
    cardStyle = [styles.card, styles.cardActive];
    icon = '💦';
    title = t('pump_running_title');
    subtitle = t('pump_running_desc');
    badgeText = t('pumping_water');
    badgeColor = Colors.accent;
  }

  return (
    <View style={cardStyle}>
      <View style={[styles.topRow, isUrdu && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.left, isUrdu && { flexDirection: 'row-reverse' }]}>
          <Text style={styles.icon}>{icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, isUrdu && styles.textRight]}>{title}</Text>
            <Text style={[styles.subtitle, isUrdu && styles.textRight]}>{subtitle}</Text>
          </View>
        </View>
      </View>
      <View style={[styles.bottomRow, isUrdu && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.badge, { backgroundColor: badgeColor + '18', borderColor: badgeColor + '40' }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
        </View>
        <Text style={styles.autoTag}>🤖 {t('autonomous_ai_tag')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#e2ece7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  cardActive: {
    borderColor: Colors.accent,
    backgroundColor: '#f0fdf4',
  },
  cardBlocked: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 3,
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#edf3f0',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  autoTag: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
  },
  textRight: {
    textAlign: 'right',
  },
});
