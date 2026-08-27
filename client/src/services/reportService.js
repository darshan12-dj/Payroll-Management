import api from './api';

export const getReport = (type, params) => api.get(`/reports/${type}`, { params });

export const exportReport = async (type, params, format) => {
  const response = await api.get(`/reports/${type}/export`, {
    params: { ...params, format },
    responseType: 'blob',
  });
  const ext = format === 'excel' ? 'xlsx' : format;
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${type}-report.${ext}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
