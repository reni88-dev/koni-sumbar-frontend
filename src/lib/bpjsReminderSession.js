export const BPJS_REMINDER_SESSION_KEY = 'koni:bpjs-document-reminder-shown';

function getSessionStorage(storage) {
  if (storage) return storage;
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage;
}

export function hasShownBPJSReminder(storage) {
  return getSessionStorage(storage)?.getItem(BPJS_REMINDER_SESSION_KEY) === '1';
}

export function markBPJSReminderShown(storage) {
  getSessionStorage(storage)?.setItem(BPJS_REMINDER_SESSION_KEY, '1');
}

export function clearBPJSReminderSession(storage) {
  getSessionStorage(storage)?.removeItem(BPJS_REMINDER_SESSION_KEY);
}
