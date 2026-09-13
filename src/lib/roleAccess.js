export {
  ACCESS_CODES,
  ACCOUNT_BLOCKED_EVENT as ROLE_ACCESS_DISABLED_EVENT,
  ACCOUNT_BLOCKED_STORAGE_KEY as ROLE_ACCESS_DISABLED_STORAGE_KEY,
  ROLE_ACCESS_DISABLED_MESSAGE,
  isAccountBlockedError as isRoleAccessDisabledError,
} from './authAccess.js';

export const ROLE_ACCESS_MESSAGE_MAX_LENGTH = 500;
export const DEFAULT_ROLE_ACCESS_MESSAGE_LABEL = 'Pesan bawaan sistem';

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
