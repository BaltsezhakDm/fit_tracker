import axios from 'axios';
import { logger } from '../lib/logger';

const api = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:8000' : 'https://test.sttgeo.ru:8443',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  logger.api(`${config.method?.toUpperCase()} ${config.url}`, {
    params: config.params,
    data: config.data
  });

  return config;
});

api.interceptors.response.use(
  (response) => {
    logger.api(`RESPONSE ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    logger.error(`API ERROR ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      logger.warn('Unauthorized access - removing token');
      localStorage.removeItem('access_token');
      // Optional: window.location.reload() or redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
