import { createContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

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
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      return null;
    }
  }, []);

  // Login
  const login = async (email, password) => {
    const response = await api.post('/api/login', { email, password });
    const { token, user: userData } = response.data;
    
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
      localStorage.removeItem('token');
      setUser(null);
      // Clear all cached queries to prevent stale data
      queryClient.clear();
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
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
    }
    
    return response.data;
  };

  // Check auth status on mount
  useEffect(() => {
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

    // Listen for unauthorized events
    const handleUnauthorized = () => {
      localStorage.removeItem('token');
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
