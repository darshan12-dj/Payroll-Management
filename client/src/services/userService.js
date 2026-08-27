import api from './api';

export const getUsers = () => api.get('/users');
export const updateUser = (id, payload) => api.put(`/users/${id}`, payload);
export const updateMyProfile = (formData) =>
  api.put('/users/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteUser = (id) => api.delete(`/users/${id}`);
