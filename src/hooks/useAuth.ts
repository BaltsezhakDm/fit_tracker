import { useState, useEffect } from 'react';
import api from '../api/client';
import { User, AuthResponse } from '../types/api';
import WebApp from '@twa-dev/sdk';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const login = async () => {
      try {
        const initData = WebApp.initData;
        if (initData) {
          const response = await api.post<AuthResponse>('/auth/telegram', { initData });
          const token = response.data.access_token;
          localStorage.setItem('access_token', token);
          console.log('Приложение запущено', response);

          // Set Authorization header immediately for subsequent requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Get user info
          const userRes = await api.get<User>('/users/me');
          setUser(userRes.data);
        }else {
          console.warn('Приложение запущено вне Telegram или initData отсутствует');
        }
      } catch (error) {
        console.error('Auth error', error);
      } finally {
        setLoading(false);
      }
    };

    login();
  }, []);

  return { user, loading };
}
