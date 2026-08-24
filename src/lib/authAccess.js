export const ACCESS_CODES = Object.freeze({
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_SESSION_INVALID: 'AUTH_SESSION_INVALID',
  ROLE_ACCESS_DISABLED: 'ROLE_ACCESS_DISABLED',
  ORGANIZATION_ASSIGNMENT_REQUIRED: 'ORGANIZATION_ASSIGNMENT_REQUIRED',
  INSUFFICIENT_PERMISSION: 'INSUFFICIENT_PERMISSION',
  ACCESS_SERVICE_UNAVAILABLE: 'ACCESS_SERVICE_UNAVAILABLE',
});

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';
export const ACCOUNT_BLOCKED_EVENT = 'auth:account-blocked';
export const PERMISSION_DENIED_EVENT = 'auth:permission-denied';
export const SESSION_NOTICE_STORAGE_KEY = 'auth:session-expired-notice';
export const ACCOUNT_BLOCKED_STORAGE_KEY = 'auth:account-blocked';

export const SESSION_EXPIRED_MESSAGE =
  'Sesi Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.';
export const ROLE_ACCESS_DISABLED_MESSAGE =
  'Akses untuk role akun Anda sedang dinonaktifkan sementara. Silakan coba kembali nanti.';
export const ORGANIZATION_ASSIGNMENT_REQUIRED_MESSAGE =
  'Akun Anda belum terhubung ke organisasi. Hubungi administrator untuk menyelesaikan penugasan akun.';
export const ACCESS_SERVICE_UNAVAILABLE_MESSAGE =
  'Layanan pemeriksaan akses sedang tidak tersedia. Silakan coba kembali.';
export const PERMISSION_CHANGED_MESSAGE =
  'Hak akses Anda telah berubah. Data dan aksi yang tersedia sedang diperbarui.';

export function getAccessCode(error) {
  return error?.response?.data?.code || '';
}

export function getHttpStatus(error) {
  return error?.response?.status || 0;
}

export function getSafeApiMessage(error, fallback = '') {
  const candidate = error?.response?.data?.message || error?.response?.data?.error;
  if (typeof candidate !== 'string') return fallback;
  const message = candidate.trim();
  return message && message.length <= 500 ? message : fallback;
}

export function isNetworkError(error) {
  return Boolean(error?.isAxiosError && !error.response);
}

export function isServerError(error) {
  return getHttpStatus(error) >= 500;
}

export function isSessionInvalidError(error) {
  const code = getAccessCode(error);
  return (
    code === ACCESS_CODES.AUTH_REQUIRED ||
    code === ACCESS_CODES.AUTH_SESSION_INVALID ||
    getHttpStatus(error) === 401
  );
}

export function isAccountBlockedError(error) {
  const code = getAccessCode(error);
  return (
    code === ACCESS_CODES.ROLE_ACCESS_DISABLED ||
    code === ACCESS_CODES.ORGANIZATION_ASSIGNMENT_REQUIRED
  );
}

export function isPermissionDeniedError(error) {
  if (isAccountBlockedError(error)) return false;
  return (
    getAccessCode(error) === ACCESS_CODES.INSUFFICIENT_PERMISSION ||
    getHttpStatus(error) === 403
  );
}

export function isAccessServiceUnavailableError(error) {
  return (
    getAccessCode(error) === ACCESS_CODES.ACCESS_SERVICE_UNAVAILABLE ||
    getHttpStatus(error) === 503
  );
}

export function getAccountBlock(errorOrDetail) {
  const code = errorOrDetail?.code || getAccessCode(errorOrDetail);
  const apiMessage = errorOrDetail?.message || getSafeApiMessage(errorOrDetail);

  if (code === ACCESS_CODES.ORGANIZATION_ASSIGNMENT_REQUIRED) {
    return {
      code,
      title: 'Organisasi Akun Belum Ditentukan',
      message: apiMessage || ORGANIZATION_ASSIGNMENT_REQUIRED_MESSAGE,
    };
  }

  return {
    code: ACCESS_CODES.ROLE_ACCESS_DISABLED,
    title: 'Akses Dinonaktifkan Sementara',
    message: apiMessage || ROLE_ACCESS_DISABLED_MESSAGE,
  };
}

export function readStoredAccountBlock() {
  try {
    const value = sessionStorage.getItem(ACCOUNT_BLOCKED_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    sessionStorage.removeItem(ACCOUNT_BLOCKED_STORAGE_KEY);
    return null;
  }
}
