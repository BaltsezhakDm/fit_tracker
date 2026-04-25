import { useState, useEffect } from 'react';
import api from '../api/client';
import { User, AuthResponse } from '../types/api';
import WebApp from '../lib/telegram';
import { logger } from '../lib/logger';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (WebApp?.initDataUnsafe) {
      logger.info('WebApp initDataUnsafe:', WebApp.initDataUnsafe);
    }
  }, []);

  useEffect(() => {
    const login = async () => {
      try {
        const initData = WebApp?.initData;
        if (initData) {
          logger.info('Authenticating with Telegram initData...');
          const response = await api.post<AuthResponse>('/auth/telegram', { initData });
          const token = response.data.access_token;
          localStorage.setItem('access_token', token);
          logger.info('Authentication successful');

          // Set Authorization header immediately for subsequent requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Get user info
          logger.info('Fetching current user info...');
          const userRes = await api.get<User>('/users/me');
          setUser(userRes.data);
          logger.info('User loaded:', userRes.data);
        } else {
          logger.warn('Running outside of Telegram or initData is missing');

          // Fallback check for local storage token
          const existingToken = localStorage.getItem('access_token');
          if (existingToken) {
            logger.info('Found existing token in localStorage, attempting to use it');
            api.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
            try {
              const userRes = await api.get<User>('/users/me');
              setUser(userRes.data);
              logger.info('User loaded from existing token');
            } catch (e) {
              logger.error('Failed to load user with existing token', e);
              localStorage.removeItem('access_token');
            }
          }
        }
      } catch (error) {
        logger.error('Auth flow failed', error);
      } finally {
        setLoading(false);
      }
    };

    login();
  }, []);

  const loginAsGuest = async () => {
    setLoading(true);
    try {
      logger.info('Logging in as guest (local testing)...');
      // For local testing, we can use a hardcoded telegram_id if the backend allows it
      // or just assume the backend might have a guest login or we already have a token
      const response = await api.post<AuthResponse>('/auth/telegram', { initData: 'guest_mode' });
      const token = response.data.access_token;
      localStorage.setItem('access_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const userRes = await api.get<User>('/users/me');
      setUser(userRes.data);
    } catch (error) {
      logger.error('Guest login failed', error);
      alert('Local login failed. Make sure your backend supports guest_mode or has a valid token.');
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, loginAsGuest };
}
