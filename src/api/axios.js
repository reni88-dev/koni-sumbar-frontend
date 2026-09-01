import axios from 'axios';
import {
  ACCESS_CODES,
  ACCOUNT_BLOCKED_EVENT,
  ACCOUNT_BLOCKED_STORAGE_KEY,
  AUTH_UNAUTHORIZED_EVENT,
  PERMISSION_CHANGED_MESSAGE,
  PERMISSION_DENIED_EVENT,
  SESSION_EXPIRED_MESSAGE,
  getAccessCode,
  getAccountBlock,
  getSafeApiMessage,
  isAccountBlockedError,
  isSessionInvalidError,
} from '../lib/authAccess';

const api = axios.create({
  baseURL: "https://apiclone.satudata.konisumbar.or.id",
  // baseURL: 'https://koni-sumbar-backend-golang.ka2h0x.easypanel.host',
  // baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    Accept: 'application/json',
  },
});

const publicEndpoints = new Set([
  '/api/login',
  '/api/forgot-password',
  '/api/reset-password/confirm',
  '/api/account-email-recovery/lookup',
  '/api/account-email-recovery/submit',
  '/api/account-email-recovery/verify',
]);

function getRequestPath(config) {
  try {
    return new URL(config?.url || '', 'http://axios.local').pathname;
  } catch {
    return '';
  }
}

api.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.setContentType(undefined);
  }

  const token = localStorage.getItem('token');
  const path = getRequestPath(config);
  const isPublic = publicEndpoints.has(path);
  config.authMeta = { hadToken: Boolean(token), token, isPublic, path };

  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentToken = localStorage.getItem('token');
    const meta = error.config?.authMeta || {
      hadToken: Boolean(currentToken),
      token: currentToken,
      isPublic: publicEndpoints.has(getRequestPath(error.config)),
      path: getRequestPath(error.config),
    };
    const isLoginRequest = meta.path === '/api/login';
    const requestMatchesCurrentSession =
      meta.hadToken && Boolean(meta.token) && meta.token === currentToken;

    if (!isLoginRequest && !meta.isPublic && requestMatchesCurrentSession && isAccountBlockedError(error)) {
      const block = getAccountBlock(error);
      localStorage.removeItem('token');
      sessionStorage.setItem(ACCOUNT_BLOCKED_STORAGE_KEY, JSON.stringify(block));
      window.dispatchEvent(new CustomEvent(ACCOUNT_BLOCKED_EVENT, { detail: block }));
    } else if (!isLoginRequest && !meta.isPublic && requestMatchesCurrentSession && isSessionInvalidError(error)) {
      localStorage.removeItem('token');
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT, {
        detail: { message: getSafeApiMessage(error, SESSION_EXPIRED_MESSAGE) },
      }));
    } else if (!isLoginRequest && !meta.isPublic && requestMatchesCurrentSession && getAccessCode(error) === ACCESS_CODES.INSUFFICIENT_PERMISSION) {
      window.dispatchEvent(new CustomEvent(PERMISSION_DENIED_EVENT, {
        detail: { message: PERMISSION_CHANGED_MESSAGE, apiMessage: getSafeApiMessage(error) },
      }));
    }

    return Promise.reject(error);
  },
);

export default api;
