import api from './api';

export const expenseService = {
  getAll: (params = {}) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  remove: (id) => api.delete(`/expenses/${id}`),
  getMonthlyReport: (year) => api.get('/expenses/monthly-report', { params: { year } }),
};
