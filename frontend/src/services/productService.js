import api from './api';

export const productService = {
  getAll: (params = {}) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  updateStock: (id, payload) => api.patch(`/products/${id}/stock`, payload),
  remove: (id) => api.delete(`/products/${id}`),
};
