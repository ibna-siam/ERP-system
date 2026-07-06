import api from './api';

export const dashboardService = {
  getSummary: () => api.get('/dashboard/summary'),
  getMonthlySales: (year) => api.get('/dashboard/monthly-sales', { params: { year } }),
  getRevenueVsExpense: (year) => api.get('/dashboard/revenue-vs-expense', { params: { year } }),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
};
