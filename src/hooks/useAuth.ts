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
      setLoading(false); // Just set loading to false since we'll use guest login
      /* 
      try {
        const initData = WebApp?.initData;
        if (initData) {
          // ...
        }
      } catch (error) {
        logger.error('Auth flow failed', error);
      } finally {
        setLoading(false);
      }
      */
    };

    login();
  }, []);

  const loginAsGuest = async () => {
    setLoading(true);
    try {
      logger.info('Logging in as guest (mock mode)...');
      // For local testing, we bypass the backend and set a mock user
      const mockUser: User = {
        id: 1,
        telegram_id: 12345,
        username: 'Tester',
        first_name: 'Test',
        last_name: 'User',
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      setUser(mockUser);
      localStorage.setItem('access_token', 'mock_token');
      api.defaults.headers.common['Authorization'] = 'Bearer mock_token';
      
      logger.info('Guest login successful (mock mode)');
    } catch (error) {
      logger.error('Guest login failed', error);
      alert('Mock login failed unexpectedly.');
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, loginAsGuest };
}
