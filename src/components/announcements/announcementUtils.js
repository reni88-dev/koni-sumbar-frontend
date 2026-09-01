export const severityStyles = {
  info: {
    label: 'Informasi',
    badge: 'bg-blue-100 text-blue-700',
    panel: 'border-blue-200 bg-blue-50',
    accent: 'bg-blue-600',
  },
  success: {
    label: 'Berhasil',
    badge: 'bg-emerald-100 text-emerald-700',
    panel: 'border-emerald-200 bg-emerald-50',
    accent: 'bg-emerald-600',
  },
  warning: {
    label: 'Peringatan',
    badge: 'bg-amber-100 text-amber-800',
    panel: 'border-amber-200 bg-amber-50',
    accent: 'bg-amber-500',
  },
  critical: {
    label: 'Kritis',
    badge: 'bg-red-100 text-red-700',
    panel: 'border-red-200 bg-red-50',
    accent: 'bg-red-600',
  },
};

export function getSeverityStyle(severity) {
  return severityStyles[severity] || severityStyles.info;
}

export function formatJakartaDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date) + ' WIB';
}

export function formatJakartaDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).reduce((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function jakartaInputToRFC3339(value) {
  if (!value) return null;
  return `${value}:00+07:00`;
}

export function getAnnouncementError(error, fallback = 'Terjadi kesalahan. Silakan coba lagi.') {
  return error?.response?.data?.message || error?.response?.data?.error || fallback;
}

export function announcementTargetLabel(announcement) {
  if (announcement?.target_all_roles) return 'Semua role';
  const roles = announcement?.target_roles || [];
  if (!roles.length) return 'Role tertentu';
  return roles.map((role) => role.display_name || role.name).join(', ');
}