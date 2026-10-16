import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';

export default function WaterLevelIndicator({ level }) {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const levelNum = parseFloat(level) || 0;
  const isEmpty = levelNum <= 10;
  const fillColor = isEmpty
    ? Colors.danger
    : levelNum > 50
    ? Colors.accent
    : Colors.warning;

  return (
    <View style={[styles.container, isEmpty && styles.containerEmpty]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, isUrdu && styles.textRight]}>
          🚰 {t('container_water_supply')}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: fillColor + '20' }]}>
          <Text style={[styles.statusText, { color: fillColor }]}>
            {isEmpty ? (isUrdu ? '⚠️ خالی ہے' : '⚠️ EMPTY') : levelNum > 50 ? (isUrdu ? '✅ مناسب' : '✅ SUFFICIENT') : (isUrdu ? '🟡 کم ہے' : '🟡 LOW')}
          </Text>
        </View>
      </View>

      <View style={[styles.contentRow, isUrdu && { flexDirection: 'row-reverse' }]}>
        {/* Visual Tank Graphic */}
        <View style={styles.tank}>
          <View
            style={[
              styles.fill,
              { height: `${Math.min(100, Math.max(0, levelNum))}%`, backgroundColor: fillColor },
            ]}
          />
          <Text style={styles.levelText}>{Math.round(levelNum)}%</Text>
        </View>

        {/* Informative text */}
        <View style={styles.infoCol}>
          {isEmpty ? (
            <View style={styles.emptyAlertBox}>
              <Text style={[styles.emptyAlertTitle, isUrdu && styles.textRight]}>
                🚨 {t('urgent_container_alert_title')}
              </Text>
              <Text style={[styles.emptyAlertDesc, isUrdu && styles.textRight]}>
                {t('urgent_container_alert_desc')}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={[styles.readyTitle, isUrdu && styles.textRight]}>
                {t('container_ready_title')}
              </Text>
              <Text style={[styles.readyDesc, isUrdu && styles.textRight]}>
                {t('container_ready_desc')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: Colors.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#e5eee9',
  },
  containerEmpty: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff8f8',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tank: {
    width: 65,
    height: 105,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#c6d9cf',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#f1f7f4',
  },
  fill: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
    zIndex: 1,
    marginBottom: 6,
  },
  infoCol: {
    flex: 1,
  },
  emptyAlertBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  emptyAlertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991b1b',
    marginBottom: 4,
  },
  emptyAlertDesc: {
    fontSize: 12,
    color: '#7f1d1d',
    lineHeight: 16,
  },
  readyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  readyDesc: {
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 17,
  },
  textRight: {
    textAlign: 'right',
  },
});
