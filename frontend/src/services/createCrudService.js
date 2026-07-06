import api from './api';

// Builds a standard set of CRUD calls for a simple REST resource.
// Used for employees, customers, suppliers (all follow the same shape).
export function createCrudService(resourcePath) {
  return {
    getAll: (params = {}) => api.get(`/${resourcePath}`, { params }),
    getById: (id) => api.get(`/${resourcePath}/${id}`),
    create: (data) => api.post(`/${resourcePath}`, data),
    update: (id, data) => api.put(`/${resourcePath}/${id}`, data),
    remove: (id) => api.delete(`/${resourcePath}/${id}`),
  };
}
