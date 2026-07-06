import api from './api';

export const reportService = {
  getSalesReport: (params = {}) => api.get('/reports/sales', { params }),
  getPurchaseReport: (params = {}) => api.get('/reports/purchases', { params }),
  getInventoryReport: () => api.get('/reports/inventory'),
  getEmployeeReport: () => api.get('/reports/employees'),
  getExpenseReport: (params = {}) => api.get('/reports/expenses', { params }),
};
