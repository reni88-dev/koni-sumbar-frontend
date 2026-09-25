import { jakartaInputToRFC3339 } from '../components/announcements/announcementUtils.js';

export {
  ACCESS_CODES,
  ACCOUNT_BLOCKED_EVENT as ROLE_ACCESS_DISABLED_EVENT,
  ACCOUNT_BLOCKED_STORAGE_KEY as ROLE_ACCESS_DISABLED_STORAGE_KEY,
  ROLE_ACCESS_DISABLED_MESSAGE,
  isAccountBlockedError as isRoleAccessDisabledError,
} from './authAccess.js';

export const ROLE_ACCESS_MESSAGE_MAX_LENGTH = 500;
export const DEFAULT_ROLE_ACCESS_MESSAGE_LABEL = 'Pesan bawaan sistem';
export const ROLE_ACCESS_SCHEDULE_MAX_DAYS = 365;
export const ROLE_ACCESS_SCHEDULE_ACTIONS = {
  disable: 'disable',
  enable: 'enable',
};

export function isRoleAccessEnabled(role) {
  return role?.access_enabled !== false;
}

export function filterRolesBySearch(roles, search) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return roles;

  return roles.filter((role) => (
    String(role?.name || '').toLowerCase().includes(normalizedSearch)
    || String(role?.display_name || '').toLowerCase().includes(normalizedSearch)
  ));
}

export function getSelectableRoles(roles) {
  return roles.filter((role) => role?.name !== 'super_admin');
}

export function pruneSelectedRoleIds(roles, search, selectedRoleIds) {
  const visibleIds = new Set(
    getSelectableRoles(filterRolesBySearch(roles, search)).map((role) => role.id),
  );
  return selectedRoleIds.filter((roleId) => visibleIds.has(roleId));
}

export function getRoleDisabledMessageLabel(role) {
  const message = typeof role?.access_disabled_message === 'string'
    ? role.access_disabled_message.trim()
    : '';
  return message || DEFAULT_ROLE_ACCESS_MESSAGE_LABEL;
}

export function buildRolesAccessRequest({
  roleIds,
  accessEnabled,
  accessDisabledMessage = '',
}) {
  const normalizedRoleIds = Array.isArray(roleIds) ? roleIds : [];
  const accessData = {
    access_enabled: accessEnabled,
    access_disabled_message: accessDisabledMessage,
  };

  if (normalizedRoleIds.length === 1) {
    return {
      url: `/api/master/roles/${normalizedRoleIds[0]}/access`,
      data: accessData,
    };
  }

  return {
    url: '/api/master/roles/access',
    data: {
      role_ids: normalizedRoleIds,
      ...accessData,
    },
  };
}

// disableAt/enableAt are `datetime-local` values (YYYY-MM-DDTHH:mm) in WIB; empty means not scheduled.
export function validateRoleAccessScheduleInput({ disableAt = '', enableAt = '', now = new Date() }) {
  if (!disableAt && !enableAt) return 'Isi minimal satu jadwal penonaktifan atau pengaktifan.';

  const maxTime = now.getTime() + ROLE_ACCESS_SCHEDULE_MAX_DAYS * 24 * 60 * 60 * 1000;
  for (const value of [disableAt, enableAt]) {
    if (!value) continue;
    const time = new Date(jakartaInputToRFC3339(value)).getTime();
    if (Number.isNaN(time)) return 'Format waktu jadwal tidak valid.';
    if (time <= now.getTime()) return 'Waktu jadwal harus di masa depan.';
    if (time > maxTime) return 'Waktu jadwal maksimal 1 tahun ke depan.';
  }

  if (disableAt && enableAt && enableAt <= disableAt) {
    return 'Waktu aktif kembali harus setelah waktu penonaktifan.';
  }
  return '';
}

export function buildRoleAccessScheduleRequest({
  roleIds,
  disableAt = '',
  enableAt = '',
  accessDisabledMessage = '',
}) {
  return {
    role_ids: Array.isArray(roleIds) ? roleIds : [],
    disable_at: disableAt ? jakartaInputToRFC3339(disableAt) : null,
    enable_at: enableAt ? jakartaInputToRFC3339(enableAt) : null,
    access_disabled_message: disableAt ? accessDisabledMessage : '',
  };
}

export function groupPendingSchedulesByRole(schedules) {
  const grouped = new Map();
  for (const schedule of Array.isArray(schedules) ? schedules : []) {
    if (schedule?.status && schedule.status !== 'pending') continue;
    const roleSchedules = grouped.get(schedule.role_id) || [];
    roleSchedules.push(schedule);
    grouped.set(schedule.role_id, roleSchedules);
  }
  for (const roleSchedules of grouped.values()) {
    roleSchedules.sort((left, right) => (
      new Date(left.run_at).getTime() - new Date(right.run_at).getTime() || left.id - right.id
    ));
  }
  return grouped;
}

export function getRoleAccessScheduleLabel(schedule) {
  return schedule?.action === ROLE_ACCESS_SCHEDULE_ACTIONS.enable
    ? 'Aktif terjadwal'
    : 'Nonaktif terjadwal';
}
