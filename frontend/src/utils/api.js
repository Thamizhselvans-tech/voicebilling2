import axios from 'axios';

// 🔥 HARDCODE (final fix)
const api = axios.create({
  baseURL: "https://voice-billing-backend.onrender.com/api"
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('vb_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vb_token');
      localStorage.removeItem('vb_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;