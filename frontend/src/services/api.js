import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Adjunta el JWT de LocalStorage en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taricai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Maneja JWT expirado (401): limpia la sesión y preserva la ruta actual
// para que el usuario pueda retomar lo que estaba haciendo tras re-autenticarse.
// Redirige a /login?redirect=... (no a /) para no perder el contexto de la tarea.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('taricai_token');
      localStorage.removeItem('taricai_user');
      localStorage.removeItem('taricai_company');
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${redirect}`;
    }
    return Promise.reject(error);
  }
);

export default api;
