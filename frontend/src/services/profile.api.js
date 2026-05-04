import api from './api';

export const getProfile      = ()     => api.get('/users/me');
export const updateProfile   = (data) => api.patch('/users/me', data);
export const changePasswordApi = (data) => api.post('/users/me/change-password', data);
