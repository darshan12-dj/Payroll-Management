import api from './api';

export const getAttendance = (params) => api.get('/attendance', { params });
export const getAttendanceStats = (params) => api.get('/attendance/stats', { params });
export const markAttendance = (payload) => api.post('/attendance', payload);
export const bulkMarkAttendance = (payload) => api.post('/attendance/bulk', payload);
export const updateAttendance = (id, payload) => api.put(`/attendance/${id}`, payload);
