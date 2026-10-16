import client from './client';

export const getAiInsights = (lang = 'en') => client.get(`/api/ai/insights?lang=${lang}`);

export const askKisanAi = (question, lang = 'ur') => client.post('/api/ai/ask', { question, lang });
