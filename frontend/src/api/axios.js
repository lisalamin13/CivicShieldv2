import axios from 'axios';

let baseUrl = import.meta.env.VITE_API_URL || '/api';
if (baseUrl !== '/api' && !baseUrl.endsWith('/api') && !baseUrl.endsWith('/api/')) {
  baseUrl = baseUrl.replace(/\/$/, '') + '/api';
}

const api = axios.create({ baseURL: baseUrl, timeout: 120000 });

// Attach JWT token from localStorage
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('cs_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Handle 401 — redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cs_token');
      localStorage.removeItem('cs_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const publicApi = axios.create({ baseURL: baseUrl, timeout: 30000 });
export default api;
