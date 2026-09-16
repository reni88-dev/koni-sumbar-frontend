export { USER_ACCESS_DISABLED_MESSAGE } from './authAccess.js';

export const USER_ACCESS_MESSAGE_MAX_LENGTH = 500;
export const DEFAULT_USER_ACCESS_MESSAGE_LABEL = 'Pesan bawaan sistem';

export function isUserAccessEnabled(user) {
  return user?.access_enabled !== false;
}

export function getUserDisabledMessageLabel(user) {
  const message = typeof user?.access_disabled_message === 'string'
    ? user.access_disabled_message.trim()
    : '';
  return message || DEFAULT_USER_ACCESS_MESSAGE_LABEL;
}
