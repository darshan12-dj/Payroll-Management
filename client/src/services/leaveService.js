import api from './api';

export const getLeaves = (params) => api.get('/leaves', { params });
export const applyLeave = (payload) => api.post('/leaves', payload);
export const approveLeave = (id, remarks) => api.put(`/leaves/${id}/approve`, { remarks });
export const rejectLeave = (id, remarks) => api.put(`/leaves/${id}/reject`, { remarks });
