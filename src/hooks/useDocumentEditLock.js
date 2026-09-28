import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
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

/**
 * Lock KTP/BPJS for one athlete or coach (`kind` = 'athletes' | 'coaches'). The global lock does
 * not hold while Porprov has returned the record for revision, so the contingent fixes the
 * documents on the same record instead of creating a duplicate. Stays locked while the status
 * loads or fails; the backend enforces the same rule.
 */
export function useDocumentEditAccess(kind, recordId) {
  const globallyLocked = useDocumentEditLock(Boolean(recordId));
  const statusQuery = useQuery({
    queryKey: ['document-edit-status', kind, Number(recordId)],
    queryFn: () => api.get(`/api/${kind}/${recordId}/document-edit-status`).then((response) => response.data),
    enabled: globallyLocked && Boolean(recordId),
  });
  if (!globallyLocked) return { locked: false, revisionPending: false };
  if (statusQuery.data?.locked === false) {
    return { locked: false, revisionPending: Boolean(statusQuery.data.revision_pending) };
  }
  return { locked: true, revisionPending: false };
}
