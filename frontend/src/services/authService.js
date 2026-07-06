import api from './api';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};
