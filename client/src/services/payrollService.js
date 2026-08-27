import api from './api';

export const calculatePayrollPreview = (payload) => api.post('/payroll/calculate', payload);
export const processPayroll = (payload) => api.post('/payroll/process', payload);
export const getPayrolls = (params) => api.get('/payroll', { params });
export const getPayroll = (id) => api.get(`/payroll/${id}`);
export const markPaid = (id) => api.put(`/payroll/${id}/mark-paid`);
