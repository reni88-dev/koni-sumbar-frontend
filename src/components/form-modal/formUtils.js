export function firstFieldError(fieldError) {
  return Array.isArray(fieldError) ? fieldError[0] : fieldError;
}

export function formatDateForInput(dateString, { allowDateFallback = false } = {}) {
  if (!dateString) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  const match = String(dateString).match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  if (!allowDateFallback) return '';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export function normalizeValidationErrors(rawErrors = {}) {
  return Object.fromEntries(
    Object.entries(rawErrors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages : [String(messages)]
    ])
  );
}
