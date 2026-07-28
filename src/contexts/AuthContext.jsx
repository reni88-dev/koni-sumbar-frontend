import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { RoleAccessDisabledDialog } from '../components/RoleAccessDisabledDialog';
import {
  ROLE_ACCESS_DISABLED_EVENT,
  ROLE_ACCESS_DISABLED_MESSAGE,
  ROLE_ACCESS_DISABLED_STORAGE_KEY,
} from '../lib/roleAccess';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleAccessMessage, setRoleAccessMessage] = useState(
    () => sessionStorage.getItem(ROLE_ACCESS_DISABLED_STORAGE_KEY) || '',
  );
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const clearRoleAccessNotice = useCallback(() => {
    sessionStorage.removeItem(ROLE_ACCESS_DISABLED_STORAGE_KEY);
    setRoleAccessMessage('');
  }, []);

  // Fetch current user
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const response = await api.get('/api/user');
      setUser(response.data);
      return response.data;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  // Login
  const login = async (email, password) => {
    const response = await api.post('/api/login', new URLSearchParams({ email, password }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const { token, user: userData } = response.data;

    clearRoleAccessNotice();

    // Store JWT token
    localStorage.setItem('token', token);
    setUser(userData);

    // Clear any cached data from previous user
    queryClient.clear();

    return response.data;
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/api/logout');
    } finally {
      clearSession();
    }
  };

  // Register
  const register = async (name, email, password, password_confirmation) => {
    const response = await api.post('/api/register', {
      name,
      email,
      password,
      password_confirmation,
    });
    
    if (response.data.token) {
      clearRoleAccessNotice();
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      queryClient.clear();
    }

    return response.data;
  };

  // Check auth status on mount
  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
    };

    const handleRoleAccessDisabled = (event) => {
      const message = event.detail?.message || ROLE_ACCESS_DISABLED_MESSAGE;
      clearSession();
      setRoleAccessMessage((currentMessage) => currentMessage || message);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener(ROLE_ACCESS_DISABLED_EVENT, handleRoleAccessDisabled);

    const initAuth = async () => {
      try {
        await fetchUser();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener(ROLE_ACCESS_DISABLED_EVENT, handleRoleAccessDisabled);
    };
  }, [clearSession, fetchUser]);

  const handleReturnToLogin = useCallback(() => {
    clearRoleAccessNotice();
    clearSession();
    navigate('/login', { replace: true });
  }, [clearRoleAccessNotice, clearSession, navigate]);

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    fetchUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <RoleAccessDisabledDialog
        message={roleAccessMessage}
        onReturnToLogin={handleReturnToLogin}
      />
    </AuthContext.Provider>
  );
}
