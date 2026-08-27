import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('payroll_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('payroll_token');
      localStorage.removeItem('payroll_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Central helper to pull a readable message out of any API error shape.
export function getErrorMessage(err) {
  if (err?.response?.data?.errors?.length) {
    return err.response.data.errors.join(' ');
  }
  return err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
}

export default api;
