import axios from 'axios';

const api = axios.create({
  baseURL: 'https://test.sttgeo.ru:8443',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      // Optional: window.location.reload() or redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
