import { useAuth } from './useAuth';
import { useSystemSettings } from './queries/useSystemSettings';

export function isSuperAdminUser(user) {
  return user?.role?.name === 'super_admin' || user?.role_id === 1 || user?.role?.id === 1;
}

// True when KTP/BPJS data of an existing profile must not be edited.
// UI only; the backend enforces the same lock and exempts super_admin.
export function useDocumentEditLock(hasExistingRecord) {
  const { user } = useAuth();
  const { data } = useSystemSettings();
  return Boolean(hasExistingRecord) && data?.document_edit_enabled === false && !isSuperAdminUser(user);
}
