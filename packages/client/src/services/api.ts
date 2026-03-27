import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env['VITE_API_BASE'] as string | undefined ?? '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const axiosError = error as { response?: { status?: number }; config?: { url?: string } };
    if (axiosError.response?.status === 401) {
      const url = axiosError.config?.url ?? '';
      if (!url.includes('/auth/')) {
        localStorage.removeItem('token');
        window.location.href = (import.meta.env['BASE_URL'] as string) + 'login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
