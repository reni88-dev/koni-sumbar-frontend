export const QUALITY_REPORT_BASE_PATH = '/laporan/kualitas-data';
export const QUALITY_REPORT_API_BASE = '/api/reports/quality';
export const QUALITY_SCAN_PERMISSION = 'reports.quality.scan';

export const QUALITY_REPORTS = [
  {
    key: 'summary',
    slug: 'ringkasan',
    label: 'Ringkasan',
    title: 'Ringkasan Kualitas Data',
    description: 'Gambaran skor, kelengkapan, temuan aktif, tren, dan peringkat kualitas data.',
    permission: 'reports.quality.summary.view',
    endpoint: 'summary',
    exportReport: 'summary',
    formats: ['pdf', 'xlsx', 'csv'],
    dateMode: 'snapshot',
  },
  {
    key: 'athletes',
    slug: 'atlet',
    label: 'Kelengkapan Atlet',
    title: 'Kelengkapan Data Atlet',
    description: 'Daftar kualitas profil atlet dengan identitas dan kontak yang tetap dimasking.',
    permission: 'reports.quality.athletes.view',
    endpoint: 'athletes',
    exportReport: 'athletes',
    formats: ['xlsx', 'csv'],
    dateMode: 'profile',
  },
  {
    key: 'coaches',
    slug: 'pelatih',
    label: 'Kelengkapan Pelatih',
    title: 'Kelengkapan Data Pelatih',
    description: 'Daftar kualitas profil pelatih dengan identitas dan kontak yang tetap dimasking.',
    permission: 'reports.quality.coaches.view',
    endpoint: 'coaches',
    exportReport: 'coaches',
    formats: ['xlsx', 'csv'],
    dateMode: 'profile',
  },
  {
    key: 'duplicates',
    slug: 'duplikat',
    label: 'Kandidat Data Ganda',
    title: 'Kandidat Data Ganda',
    description: 'Pasangan profil dan sinyal kecocokan untuk peninjauan read-only.',
    permission: 'reports.quality.duplicates.view',
    endpoint: 'duplicates',
    exportReport: 'duplicates',
    formats: ['xlsx', 'csv'],
    dateMode: 'finding',
  },
  {
    key: 'validity',
    slug: 'validitas',
    label: 'Validitas Identitas & Kontak',
    title: 'Validitas Identitas dan Kontak',
    description: 'Temuan validitas NIK, KK, telepon, dan email tanpa menampilkan nilai sensitif penuh.',
    permission: 'reports.quality.validity.view',
    endpoint: 'validity',
    exportReport: 'validity',
    formats: ['xlsx', 'csv'],
    dateMode: 'finding',
  },
  {
    key: 'documents',
    slug: 'dokumen',
    label: 'Kelengkapan Dokumen',
    title: 'Kelengkapan Dokumen',
    description: 'Status pemeriksaan dokumen profil tanpa fasilitas unggah atau perbaikan file.',
    permission: 'reports.quality.documents.view',
    endpoint: 'documents',
    exportReport: 'documents',
    formats: ['xlsx', 'csv'],
    dateMode: 'document',
  },
  {
    key: 'distribution',
    slug: 'sebaran',
    label: 'Sebaran Organisasi & Cabor',
    title: 'Sebaran Organisasi dan Cabor',
    description: 'Sebaran profil, skor, dan masalah berdasarkan wilayah, organisasi, pengcab, dan cabor.',
    permission: 'reports.quality.distribution.view',
    endpoint: 'distribution',
    exportReport: 'distribution',
    formats: ['xlsx', 'csv'],
    dateMode: 'snapshot',
  },
].map((report) => ({
  ...report,
  path: `${QUALITY_REPORT_BASE_PATH}/${report.slug}`,
}));

export const QUALITY_REPORT_VIEW_PERMISSIONS = QUALITY_REPORTS.map((report) => report.permission);

export function getQualityReportByKey(key) {
  return QUALITY_REPORTS.find((report) => report.key === key) || null;
}

export function getQualityReportByPath(pathname) {
  return QUALITY_REPORTS.find((report) => report.path === pathname) || null;
}

export function hasQualityReportPermission(permissions, permission) {
  const values = Array.isArray(permissions) ? permissions : [];
  return values.includes('*') || values.includes(permission);
}

export function getAllowedQualityReports(permissions) {
  return QUALITY_REPORTS.filter((report) => hasQualityReportPermission(permissions, report.permission));
}

export function getFirstAllowedQualityReport(permissions) {
  return getAllowedQualityReports(permissions)[0] || null;
}
