export const ROLE_ACCESS_DISABLED_CODE = 'ROLE_ACCESS_DISABLED';
export const ROLE_ACCESS_DISABLED_EVENT = 'auth:role-access-disabled';
export const ROLE_ACCESS_DISABLED_STORAGE_KEY = 'auth:role-access-disabled-message';
export const ROLE_ACCESS_DISABLED_MESSAGE =
  'Akses untuk role akun Anda sedang dinonaktifkan sementara. Silakan coba kembali nanti.';

export function isRoleAccessDisabledError(error) {
  return (
    error.response?.status === 403 &&
    error.response?.data?.code === ROLE_ACCESS_DISABLED_CODE
  );
}
