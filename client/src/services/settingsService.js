import api from './api';

export const getSettings = () => api.get('/settings');
export const updateSettings = (payload) => api.put('/settings', payload);
