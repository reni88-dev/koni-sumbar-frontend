export const QUALITY_LABELS = {
  profile: 'Data profil',
  account: 'Akun pengguna',
  organization: 'Organisasi',
  storage: 'File di penyimpanan',
  document_expiry: 'Masa berlaku dokumen',
  ocr: 'Pembacaan isi dokumen otomatis',
  subcluster: 'Kelompok pembinaan rinci',
  creator_updater: 'Petugas yang menambah / mengubah profil',
  source: 'Asal data',
  incomplete_profile: 'Data profil belum lengkap',
  invalid_document: 'Dokumen perlu diperiksa',
  missing_document: 'Dokumen belum lengkap',
  athlete: 'Atlet',
  coach: 'Pelatih',
  complete: 'Lengkap',
  needs_completion: 'Perlu dilengkapi',
  many_gaps: 'Banyak kekurangan',
  critical: 'Perlu segera ditangani',
  medium: 'Sedang',
  low: 'Rendah',
  open: 'Belum ditangani',
  in_progress: 'Sedang ditangani',
  resolved: 'Selesai',
  ignored: 'Tidak ditindaklanjuti',
  certain_duplicate: 'Data ganda terdeteksi',
  identity_conflict: 'Identitas tidak cocok',
  possible_duplicate: 'Kemungkinan data ganda',
  shared_contact: 'Kontak dipakai beberapa profil',
  invalid_nik: 'NIK tidak valid',
  invalid_kk: 'KK tidak valid',
  invalid_phone: 'Telepon tidak valid',
  invalid_email: 'Email tidak valid',
  photo: 'Foto',
  identity: 'Identitas',
  bpjs: 'BPJS',
  certificate: 'Sertifikat',
  available: 'Tersedia',
  missing_reference: 'Dokumen belum tercatat',
  missing_object: 'File tidak ditemukan',
  invalid_type: 'Tipe file tidak valid',
  expired: 'Kedaluwarsa',
  duplicate_object: 'File dipakai beberapa profil',
  unverified: 'Belum diperiksa',
  nik: 'NIK sama',
  kk: 'Nomor KK sama',
  user: 'Akun pengguna sama',
  name_birth: 'Nama dan tanggal lahir serupa',
  fuzzy_name_birth: 'Kemiripan nama dan tanggal lahir',
  organization_cabor_name: 'Nama, organisasi, dan cabor serupa',
  phone: 'Telepon sama',
  email: 'Email sama',
  document_object: 'File dokumen sama',
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