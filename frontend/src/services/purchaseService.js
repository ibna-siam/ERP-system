import api from './api';

export const purchaseService = {
  getAll: (params = {}) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  updateStatus: (id, status) => api.patch(`/purchases/${id}/status`, { status }),
};
