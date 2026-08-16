//this is the api.js file 
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const userAPI = {
  updateProfile: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, v);
    });
    return api.put('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getLeaderboard: () => api.get('/users/leaderboard/finders'),
  registerFCM: (token) => api.post('/users/fcm-token', { token }),
};

export const itemAPI = {
  getAll: (params) => api.get('/items', { params }),
  getRecent: () => api.get('/items/recent'),
  getHeatmap: () => api.get('/items/heatmap'),
  getById: (id) => api.get(`/items/${id}`),
  getMatches: (id) => api.get(`/items/${id}/matches`),
  create: (formData) =>
    api.post('/items', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateStatus: (id, status) => api.put(`/items/${id}/status`, { status }),
  report: (id, data) => api.post(`/items/${id}/report`, data),
  delete: (id) => api.delete(`/items/${id}`),
  findSimilar: (formData) =>
    api.post('/items/ai/similar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const claimAPI = {
  create: (itemId, formData) =>
    api.post(`/claims/${itemId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getByItem: (itemId) => api.get(`/claims/item/${itemId}`),
  getMy: () => api.get('/claims/my'),
  review: (id, data) => api.put(`/claims/${id}/review`, data),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const chatAPI = {
  getMessages: (itemId) => api.get(`/chat/${itemId}`),
  sendMessage: (itemId, data) => api.post(`/chat/${itemId}`, data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  getItems: (params) => api.get('/admin/items', { params }),
  approveItem: (id) => api.put(`/admin/items/${id}/approve`),
  removeItem: (id) => api.put(`/admin/items/${id}/remove`),
  getClaims: () => api.get('/admin/claims'),
  getReports: () => api.get('/admin/reports'),
  reviewReport: (id, data) => api.put(`/admin/reports/${id}`, data),
};
