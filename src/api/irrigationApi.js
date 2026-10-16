import client from './client';

export const getIrrigationStatus = () => client.get('/api/irrigation/status');

export const getIrrigationConfig = () => client.get('/api/irrigation/config');

export const updateIrrigationConfig = (data) => client.put('/api/irrigation/config', data);

export const togglePump = (pumpOn) => client.post('/api/irrigation/pump', { pump_on: pumpOn });
