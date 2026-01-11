import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user
  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/api/user');
      setUser(response.data);
      return response.data;
    } catch (error) {
      setUser(null);
      return null;
    }
  }, []);

  // Get CSRF cookie
  const getCsrfCookie = async () => {
    await api.get('/sanctum/csrf-cookie');
  };

  // Login
  const login = async (email, password) => {
    await getCsrfCookie();
    const response = await api.post('/api/login', { email, password });
    setUser(response.data.user);
    return response.data;
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/api/logout');
    } finally {
      setUser(null);
    }
  };

  // Register
  const register = async (name, email, password, password_confirmation) => {
    await getCsrfCookie();
    const response = await api.post('/api/register', {
      name,
      email,
      password,
      password_confirmation,
    });
    setUser(response.data.user);
    return response.data;
  };

  // Check auth status on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await getCsrfCookie();
        await fetchUser();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for unauthorized events
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [fetchUser]);

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
    </AuthContext.Provider>
  );
}
