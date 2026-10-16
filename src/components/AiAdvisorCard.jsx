import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, ScrollView,
} from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/theme';
import { askKisanAi } from '../api/aiApi';

export default function AiAdvisorCard({ aiData, onRefresh, loading }) {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  // Kisan AI Chat Modal State
  const [chatVisible, setChatVisible] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [askingAi, setAskingAi] = useState(false);

  const handleAsk = async (queryText) => {
    const q = queryText || chatQuestion;
    if (!q.trim()) return;

    setAskingAi(true);
    setChatAnswer('');
    try {
      const res = await askKisanAi(q, i18n.language);
      setChatAnswer(res.data.answer);
    } catch (_) {
      setChatAnswer(
        isUrdu
          ? 'معذرت، اس وقت رابطہ نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔'
          : 'Could not connect to Kisan AI. Please try again.'
      );
    }
    setAskingAi(false);
  };

  const quickQuestions = isUrdu ? [
    '💧 کیا اس وقت پودے کو پانی دینا چاہیے؟',
    '🌡️ موجودہ درجہ حرارت اور گرمی کا پودے پر کیا اثر ہے؟',
    '🧪 پودے کے لیے کھاد کا مشورہ کیا ہے؟',
  ] : [
    '💧 Should I water the plant right now?',
    '🌡️ How does current heat & humidity affect my plant?',
    '🧪 What fertilizer advice do you have for this soil?',
  ];

  if (!aiData) {
    return (
      <View style={styles.card}>
        <Text style={[styles.title, isUrdu && styles.textRight]}>{t('ai_advisor_title')}</Text>
        <Text style={[styles.desc, isUrdu && styles.textRight]}>
          {isUrdu ? 'موسم اور مٹی کی نمی کا تجزیہ ہو رہا ہے...' : 'Analyzing microclimate & soil moisture...'}
        </Text>
      </View>
    );
  }

  const isAlert = aiData.alert_needed || aiData.container_empty;
  const statusColor = isAlert ? Colors.danger : aiData.ai_action === 'IRRIGATE_NOW' ? Colors.accent : Colors.secondary;

  return (
    <View style={[styles.card, isAlert && styles.cardAlert]}>
      {/* Header */}
      <View style={[styles.header, isUrdu && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.headerLeft, isUrdu && { alignItems: 'flex-end' }]}>
          <Text style={styles.aiTag}>✨ {t('ai_advisor_tag')}</Text>
          <Text style={styles.title}>🧠 {t('ai_advisor_title')}</Text>
        </View>
        <TouchableOpacity style={styles.analyzeBtn} onPress={onRefresh} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.analyzeBtnText}>⚡ {t('re_evaluate')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Decision Banner */}
      <View style={[styles.decisionBox, { backgroundColor: statusColor + '15', borderColor: statusColor + '40' }]}>
        <Text style={[styles.decisionHeadline, { color: statusColor }, isUrdu && styles.textRight]}>
          {aiData.ai_headline || t('auto_irrigation')}
        </Text>
        <Text style={[styles.recommendationText, isUrdu && styles.textRight]}>
          {aiData.ai_recommendation}
        </Text>
      </View>

      {/* AI Metrics Grid */}
      <View style={[styles.metricsGrid, isUrdu && { flexDirection: 'row-reverse' }]}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>{t('health_score')}</Text>
          <Text style={[styles.metricValue, { color: Colors.secondary }]}>
            {aiData.plant_health_score || 95}%
          </Text>
          <Text style={styles.metricSub}>{t('plant_vitality')}</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>{t('vpd_climate')}</Text>
          <Text style={[styles.metricValue, { color: Colors.primary }]}>
            {aiData.vpd_kpa ?? 1.4} kPa
          </Text>
          <Text style={styles.metricSub}>{aiData.et_status || 'Optimal'}</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>{t('water_saved')}</Text>
          <Text style={[styles.metricValue, { color: Colors.accent }]}>
            {aiData.water_saved_ml || 420} ml
          </Text>
          <Text style={styles.metricSub}>{t('vs_timers')}</Text>
        </View>
      </View>

      {/* Environmental note */}
      {aiData.climate_note && (
        <View style={styles.footerNote}>
          <Text style={[styles.footerNoteText, isUrdu && styles.textRight]}>
            💡 <Text style={{ fontWeight: '700' }}>{isUrdu ? 'زرعی بصیرت:' : 'AI Agronomy Insight:'}</Text> {aiData.climate_note}
          </Text>
        </View>
      )}

      {/* Ask Kisan AI Interactive Button */}
      <TouchableOpacity
        style={styles.askAiBannerBtn}
        activeOpacity={0.85}
        onPress={() => setChatVisible(true)}
      >
        <View style={[styles.askAiRow, isUrdu && { flexDirection: 'row-reverse' }]}>
          <Text style={styles.askAiIcon}>💬</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.askAiTitle, isUrdu && styles.textRight]}>
              {t('ask_kisan_ai')}
            </Text>
            <Text style={[styles.askAiSub, isUrdu && styles.textRight]}>
              {isUrdu
                ? 'پودے کو پانی، کھاد یا موسم سے متعلق کوئی بھی سوال پوچھیں'
                : 'Ask questions about watering, climate stress & fertilizer'}
            </Text>
          </View>
          <Text style={styles.askAiArrow}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Interactive Kisan AI Q&A Modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.chatModalCard}>
            <View style={[styles.chatModalHeader, isUrdu && { flexDirection: 'row-reverse' }]}>
              <View>
                <Text style={[styles.chatModalTitle, isUrdu && styles.textRight]}>
                  🌾 {t('ask_kisan_ai')}
                </Text>
                <Text style={[styles.chatModalSubtitle, isUrdu && styles.textRight]}>
                  {isUrdu ? 'آپ کے سینسرز کے لائیو ڈیٹا پر مبنی فوری جوابات' : 'Instant advice tailored to your live plant telemetry'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setChatVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* Quick Prompt Pills */}
              <Text style={[styles.quickHeading, isUrdu && styles.textRight]}>
                {isUrdu ? 'فوری سوالات منتخب کریں:' : 'Suggested Questions:'}
              </Text>
              <View style={styles.quickWrap}>
                {quickQuestions.map((q, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickPill}
                    onPress={() => {
                      setChatQuestion(q);
                      handleAsk(q);
                    }}
                  >
                    <Text style={styles.quickPillText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* AI Answer Box */}
              {askingAi ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>
                    {isUrdu ? 'کسان AI لائیو سینسر ڈیٹا کا جائزہ لے رہا ہے...' : 'Kisan AI is analyzing live telemetry...'}
                  </Text>
                </View>
              ) : chatAnswer ? (
                <View style={styles.answerBox}>
                  <Text style={[styles.answerHeading, isUrdu && styles.textRight]}>
                    🌿 {isUrdu ? 'کسان AI کا مشورہ:' : 'Kisan AI Recommendation:'}
                  </Text>
                  <Text style={[styles.answerContent, isUrdu && styles.textRight]}>
                    {chatAnswer}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Custom Question Input */}
            <View style={[styles.inputRow, isUrdu && { flexDirection: 'row-reverse' }]}>
              <TextInput
                style={[styles.chatInput, isUrdu && styles.textRight]}
                placeholder={t('kisan_ai_placeholder')}
                placeholderTextColor="#9ca3af"
                value={chatQuestion}
                onChangeText={setChatQuestion}
              />
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => handleAsk()}
                disabled={askingAi}
              >
                <Text style={styles.sendBtnText}>{isUrdu ? 'پوچھیں' : 'Ask'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#d2e7dc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  cardAlert: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffcfc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flex: 1,
  },
  aiTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    color: Colors.text,
  },
  analyzeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  analyzeBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  decisionBox: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  decisionHeadline: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },
  recommendationText: {
    fontSize: 12.5,
    color: Colors.text,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5faf7',
    borderRadius: 12,
    padding: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    marginVertical: 2,
  },
  metricSub: {
    fontSize: 10,
    color: Colors.textLight,
  },
  footerNote: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e8f0ec',
  },
  footerNoteText: {
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 16,
  },
  askAiBannerBtn: {
    backgroundColor: '#e6f4ea',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#c6e7d2',
  },
  askAiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  askAiIcon: {
    fontSize: 22,
  },
  askAiTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0d3b2e',
  },
  askAiSub: {
    fontSize: 11,
    color: '#2d6a4f',
    marginTop: 2,
  },
  askAiArrow: {
    fontSize: 22,
    color: '#0d3b2e',
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  chatModalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  chatModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2ef',
  },
  chatModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  chatModalSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 3,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textLight,
  },
  quickHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
    marginBottom: 8,
  },
  quickWrap: {
    gap: 8,
    marginBottom: 14,
  },
  quickPill: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  quickPillText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  answerBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  answerHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 6,
  },
  answerContent: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
  },
  sendBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  textRight: {
    textAlign: 'right',
  },
  desc: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 6,
  },
});
