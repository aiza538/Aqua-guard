import client from './client';

export const getLatestReading = () => client.get('/api/sensors/latest');

export const getSensorHistory = () => client.get('/api/sensors/history');
