import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ───────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Projects API ───────────────────────────────────────────────────
export const projectsAPI = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// ─── Prompts API ────────────────────────────────────────────────────
export const promptsAPI = {
  list: (projectId) => api.get(`/projects/${projectId}/prompts`),
  create: (projectId, data) => api.post(`/projects/${projectId}/prompts`, data),
  update: (promptId, data) => api.put(`/prompts/${promptId}`, data),
  delete: (promptId) => api.delete(`/prompts/${promptId}`),
};

// ─── Chat API ───────────────────────────────────────────────────────
export const chatAPI = {
  sendMessage: (projectId, message) =>
    api.post(`/projects/${projectId}/chat`, { message }),
  getMessages: (projectId) => api.get(`/projects/${projectId}/messages`),
  clearMessages: (projectId) => api.delete(`/projects/${projectId}/messages`),
};

// ─── Files API ──────────────────────────────────────────────────────
export const filesAPI = {
  list: (projectId) => api.get(`/projects/${projectId}/files`),
  upload: (projectId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/projects/${projectId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (fileId) => api.delete(`/files/${fileId}`),
};

export default api;
