import api from './api';

export const getSalaryStructures = (params) => api.get('/salary-structures', { params });
export const getSalaryStructureForEmployee = (employeeId) => api.get(`/salary-structures/${employeeId}`);
export const upsertSalaryStructure = (payload) => api.post('/salary-structures', payload);
export const previewCalculation = (payload) => api.post('/salary-structures/preview', payload);
