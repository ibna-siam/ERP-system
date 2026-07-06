import api from './api';

export const inventoryService = {
  getCurrent: () => api.get('/inventory/current'),
  getHistory: (params = {}) => api.get('/inventory/history', { params }),
};
