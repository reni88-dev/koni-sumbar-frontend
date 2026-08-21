export const complaintCategories = [
  { value: 'akses_login', label: 'Akses / Login' },
  { value: 'data', label: 'Data' },
  { value: 'upload_unduh', label: 'Upload / Unduh' },
  { value: 'fitur', label: 'Fitur' },
  { value: 'tampilan', label: 'Tampilan' },
  { value: 'performa', label: 'Performa' },
  { value: 'lainnya', label: 'Lainnya' },
];

export const complaintImpacts = [
  { value: 'blocking', label: 'Blocking', description: 'Pekerjaan tidak dapat dilanjutkan.' },
  { value: 'partial', label: 'Sebagian terganggu', description: 'Masih ada cara lain, tetapi pekerjaan terhambat.' },
  { value: 'minor', label: 'Minor', description: 'Gangguan kecil dan pekerjaan tetap dapat berjalan.' },
];

export const complaintStatuses = [
  { value: 'baru', label: 'Baru' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'selesai', label: 'Selesai' },
];

export function complaintLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value || '-';
}

export function complaintStatusClasses(status) {
  if (status === 'selesai') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'diproses') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

export function complaintImpactClasses(impact) {
  if (impact === 'blocking') return 'bg-red-50 text-red-700';
  if (impact === 'partial') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

export function formatComplaintDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}

export function complaintErrorMessage(error, fallback = 'Terjadi kesalahan. Silakan coba lagi.') {
  return error?.response?.data?.message || error?.response?.data?.error || fallback;
}
