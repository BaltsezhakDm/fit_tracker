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
          const response = await api.post<AuthResponse>('/auth/login', { initData });
          localStorage.setItem('access_token', response.data.access_token);

          // Get user info (Assuming /users/me or similar)
          // For now using the telegram_id from initDataUnsafe
          const tgId = WebApp.initDataUnsafe.user?.id;
          if (tgId) {
            const userRes = await api.get<User>(`/users/telegram/${tgId}`);
            setUser(userRes.data);
          }
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
