import api from './api';

export const settingsService = {
  getCompany: () => api.get('/settings/company'),
  updateCompany: (data) => api.put('/settings/company', data),
};
