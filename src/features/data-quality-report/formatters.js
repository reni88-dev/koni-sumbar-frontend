export const QUALITY_LABELS = {
  athlete: 'Atlet',
  coach: 'Pelatih',
  complete: 'Lengkap',
  needs_completion: 'Perlu dilengkapi',
  many_gaps: 'Banyak kekurangan',
  critical: 'Kritis',
  medium: 'Sedang',
  low: 'Rendah',
  open: 'Terbuka',
  in_progress: 'Diproses',
  resolved: 'Selesai',
  ignored: 'Diabaikan',
  certain_duplicate: 'Duplikat pasti',
  identity_conflict: 'Konflik identitas',
  possible_duplicate: 'Kemungkinan duplikat',
  shared_contact: 'Kontak bersama',
  invalid_nik: 'NIK tidak valid',
  invalid_kk: 'KK tidak valid',
  invalid_phone: 'Telepon tidak valid',
  invalid_email: 'Email tidak valid',
  photo: 'Foto',
  identity: 'Identitas',
  bpjs: 'BPJS',
  certificate: 'Sertifikat',
  available: 'Tersedia',
  missing_reference: 'Referensi kosong',
  missing_object: 'File tidak ditemukan',
  invalid_type: 'Tipe file tidak valid',
  expired: 'Kedaluwarsa',
  duplicate_object: 'File terduplikasi',
  unverified: 'Belum diverifikasi',
  nik: 'NIK sama',
  kk: 'Nomor KK sama',
  user: 'Akun pengguna sama',
  name_birth: 'Nama dan tanggal lahir serupa',
  fuzzy_name_birth: 'Kemiripan nama dan tanggal lahir',
  organization_cabor_name: 'Nama, organisasi, dan cabor serupa',
  phone: 'Telepon sama',
  email: 'Email sama',
  document_object: 'Object dokumen sama',
};

export function qualityLabel(value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return QUALITY_LABELS[value] || String(value).replaceAll('_', ' ');
}

export function formatQualityNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits });
}

export function formatQualityScore(value) {
  return Number(value || 0).toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatQualityDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date) + ' WIB';
}

export function formatQualityDate(value) {
  if (!value) return '-';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00+07:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
  }).format(date);
}

export function parseQualityJSON(value, fallback) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function qualityTone(value) {
  switch (value) {
    case 'complete':
    case 'available':
    case 'resolved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'critical':
    case 'missing_object':
    case 'invalid_type':
    case 'expired':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'medium':
    case 'many_gaps':
    case 'needs_completion':
    case 'in_progress':
    case 'unverified':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}