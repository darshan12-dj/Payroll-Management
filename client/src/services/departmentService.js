import api from './api';

export const getDepartments = () => api.get('/departments');
export const getDepartment = (id) => api.get(`/departments/${id}`);
export const createDepartment = (payload) => api.post('/departments', payload);
export const updateDepartment = (id, payload) => api.put(`/departments/${id}`, payload);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`);
