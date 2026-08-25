import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AccessServiceUnavailableScreen } from '../components/AccessServiceUnavailableScreen';
import { AccountBlockedDialog } from '../components/AccountBlockedDialog';
import { PermissionChangedNotice } from '../components/PermissionChangedNotice';
import {
  ACCESS_SERVICE_UNAVAILABLE_MESSAGE,
  ACCOUNT_BLOCKED_EVENT,
  ACCOUNT_BLOCKED_STORAGE_KEY,
  AUTH_UNAUTHORIZED_EVENT,
  PERMISSION_CHANGED_MESSAGE,
  PERMISSION_DENIED_EVENT,
  SESSION_EXPIRED_MESSAGE,
  SESSION_NOTICE_STORAGE_KEY,
  getAccountBlock,
  getSafeApiMessage,
  isAccessServiceUnavailableError,
  isAccountBlockedError,
  isNetworkError,
  isServerError,
  isSessionInvalidError,
  readStoredAccountBlock,
} from '../lib/authAccess';
import { AuthContext } from './auth-context';

function getUnavailableMessage(error) {
  return getSafeApiMessage(error, ACCESS_SERVICE_UNAVAILABLE_MESSAGE);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryingAccess, setRetryingAccess] = useState(false);
  const [accessUnavailable, setAccessUnavailable] = useState(null);
  const [accountBlock, setAccountBlock] = useState(readStoredAccountBlock);
  const [sessionNotice, setSessionNotice] = useState(
    () => sessionStorage.getItem(SESSION_NOTICE_STORAGE_KEY) || '',
  );
  const [permissionNotice, setPermissionNotice] = useState('');
  const permissionRefreshRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const clearAccountBlock = useCallback(() => {
    sessionStorage.removeItem(ACCOUNT_BLOCKED_STORAGE_KEY);
    setAccountBlock(null);
  }, []);

  const clearSessionNotice = useCallback(() => {
    sessionStorage.removeItem(SESSION_NOTICE_STORAGE_KEY);
    setSessionNotice('');
  }, []);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setAccessUnavailable(null);
      return null;
    }

    try {
      const response = await api.get('/api/user');
      setUser(response.data);
      setAccessUnavailable(null);
      return response.data;
    } catch (error) {
      if (
        isAccessServiceUnavailableError(error) ||
        isNetworkError(error) ||
        isServerError(error)
      ) {
        setAccessUnavailable({ message: getUnavailableMessage(error) });
      } else if (!isSessionInvalidError(error) && !isAccountBlockedError(error)) {
        setAccessUnavailable({ message: getUnavailableMessage(error) });
      }
      throw error;
    }
  }, []);

  const refreshPermissions = useCallback(() => {
    if (permissionRefreshRef.current) return permissionRefreshRef.current;

    const refresh = api.get('/api/user')
      .then((response) => {
        setUser(response.data);
        queryClient.clear();
        setAccessUnavailable(null);
        return response.data;
      })
      .catch((error) => {
        if (
          isAccessServiceUnavailableError(error) ||
          isNetworkError(error) ||
          isServerError(error)
        ) {
          setAccessUnavailable({ message: getUnavailableMessage(error) });
        }
        throw error;
      })
      .finally(() => {
        permissionRefreshRef.current = null;
      });

    permissionRefreshRef.current = refresh;
    return refresh;
  }, [queryClient]);

  const login = async (email, password) => {
    const response = await api.post('/api/login', new URLSearchParams({ email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const { token, user: userData } = response.data;

    clearAccountBlock();
    clearSessionNotice();
    setPermissionNotice('');
    setAccessUnavailable(null);
    localStorage.setItem('token', token);
    setUser(userData);
    queryClient.clear();
    return response.data;
  };

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem('token')) {
        await api.post('/api/logout');
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const register = async (name, email, password, password_confirmation) => {
    const response = await api.post('/api/register', {
      name,
      email,
      password,
      password_confirmation,
    });

    if (response.data.token) {
      clearAccountBlock();
      clearSessionNotice();
      setAccessUnavailable(null);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      queryClient.clear();
    }
    return response.data;
  };

  useEffect(() => {
    const handleUnauthorized = (event) => {
      const message = event.detail?.message || SESSION_EXPIRED_MESSAGE;
      if (!sessionStorage.getItem(SESSION_NOTICE_STORAGE_KEY)) {
        sessionStorage.setItem(SESSION_NOTICE_STORAGE_KEY, message);
      }
      setSessionNotice((current) => current || message);
      setAccessUnavailable(null);
      clearSession();
    };

    const handleAccountBlocked = (event) => {
      const block = getAccountBlock(event.detail || {});
      sessionStorage.setItem(ACCOUNT_BLOCKED_STORAGE_KEY, JSON.stringify(block));
      setAccessUnavailable(null);
      clearSession();
      setAccountBlock((current) => current || block);
    };

    const handlePermissionDenied = (event) => {
      setPermissionNotice(event.detail?.message || PERMISSION_CHANGED_MESSAGE);
      refreshPermissions().catch(() => {});
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    window.addEventListener(ACCOUNT_BLOCKED_EVENT, handleAccountBlocked);
    window.addEventListener(PERMISSION_DENIED_EVENT, handlePermissionDenied);

    const initTimer = window.setTimeout(() => {
      fetchUser().catch(() => {}).finally(() => setLoading(false));
    }, 0);

    return () => {
      window.clearTimeout(initTimer);
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
      window.removeEventListener(ACCOUNT_BLOCKED_EVENT, handleAccountBlocked);
      window.removeEventListener(PERMISSION_DENIED_EVENT, handlePermissionDenied);
    };
  }, [clearSession, fetchUser, refreshPermissions]);

  const retryAccess = useCallback(async () => {
    setRetryingAccess(true);
    setAccessUnavailable(null);
    try {
      await fetchUser();
    } catch {
      // fetchUser preserves the token and restores the retry screen when appropriate.
    } finally {
      setRetryingAccess(false);
    }
  }, [fetchUser]);

  const handleExplicitLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      clearAccountBlock();
      clearSessionNotice();
      setAccessUnavailable(null);
      navigate('/login', { replace: true });
    }
  }, [clearAccountBlock, clearSessionNotice, logout, navigate]);

  const handleReturnToLogin = useCallback(() => {
    clearAccountBlock();
    clearSession();
    navigate('/login', { replace: true });
  }, [clearAccountBlock, clearSession, navigate]);

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    fetchUser,
    sessionNotice,
    clearSessionNotice,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {accessUnavailable && localStorage.getItem('token') ? (
        <AccessServiceUnavailableScreen
          message={accessUnavailable.message}
          onRetry={retryAccess}
          onLogout={handleExplicitLogout}
          retrying={retryingAccess}
        />
      ) : children}
      <PermissionChangedNotice
        message={permissionNotice}
        onClose={() => setPermissionNotice('')}
      />
      <AccountBlockedDialog block={accountBlock} onReturnToLogin={handleReturnToLogin} />
    </AuthContext.Provider>
  );
}
