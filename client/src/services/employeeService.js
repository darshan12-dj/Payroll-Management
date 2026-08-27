import api from './api';

export const getEmployees = (params) => api.get('/employees', { params });
export const getEmployee = (id) => api.get(`/employees/${id}`);
export const createEmployee = (formData) =>
  api.post('/employees', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateEmployee = (id, formData) =>
  api.put(`/employees/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteEmployee = (id, hard = false) => api.delete(`/employees/${id}${hard ? '?hard=true' : ''}`);
export const getEmployeeAttendance = (id, params) => api.get(`/employees/${id}/attendance`, { params });
export const getEmployeePayrollHistory = (id) => api.get(`/employees/${id}/payroll`);
