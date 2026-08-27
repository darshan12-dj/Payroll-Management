import api from './api';

export const getPayslips = (params) => api.get('/payslips', { params });
export const getPayslip = (id) => api.get(`/payslips/${id}`);
export const generatePayslip = (payrollId) => api.post(`/payslips/generate/${payrollId}`);

// The PDF route is JWT-protected, so a plain <a href> can't carry the auth
// header — fetch it as a blob instead and hand back an object URL the
// caller can open in a new tab, embed in an <iframe>, or trigger a download.
export const fetchPayslipBlobUrl = async (id) => {
  const response = await api.get(`/payslips/${id}/pdf`, { responseType: 'blob' });
  return window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
};

export const downloadPayslip = async (id, filename) => {
  const url = await fetchPayslipBlobUrl(id);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename || 'payslip'}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
