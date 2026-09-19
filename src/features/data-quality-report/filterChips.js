import { formatQualityDate, qualityLabel } from './formatters.js';

export const QUALITY_SCOPE_FILTERS = [
  ['region_ids', 'Wilayah', 'regions'],
  ['organization_ids', 'Organisasi', 'organizations'],
  ['federation_ids', 'Federasi', 'federations'],
  ['cabor_ids', 'Cabor', 'cabors'],
  ['pengcab_ids', 'Pengcab', 'pengcabs'],
];

function optionNames(ids, options) {
  const index = new Map((options || []).map((option) => [Number(option.id), option.name]));
  return (ids || []).map((id) => index.get(Number(id)) || `ID ${id}`).join(', ');
}

export function buildQualityFilterChips(reportKey, filters, options) {
  const chips = [];
  for (const [field, label, optionKey] of QUALITY_SCOPE_FILTERS) {
    if (filters[field]?.length) chips.push([field, `${label}: ${optionNames(filters[field], options?.[optionKey])}`]);
  }
  if (filters.as_of_date) chips.push(['as_of_date', `Posisi: ${formatQualityDate(filters.as_of_date)}`]);
  if (filters.date_from && filters.date_to) chips.push(['date_range', `${formatQualityDate(filters.date_from)} – ${formatQualityDate(filters.date_to)}`]);
  for (const [field, label] of [
    ['gender', 'Jenis kelamin'],
    ['record_status', 'Status profil'],
    ['account_status', 'Status akun'],
    ['completeness_category', 'Kelengkapan'],
    ['finding_type', reportKey === 'duplicates' ? 'Klasifikasi' : 'Jenis masalah'],
    ['priority', 'Prioritas'],
    ['finding_status', 'Status temuan'],
    ['document_type', 'Jenis dokumen'],
    ['document_status', 'Status dokumen'],
  ]) {
    if (filters[field]) chips.push([field, `${label}: ${qualityLabel(filters[field])}`]);
  }
  if (filters.search) chips.push(['search', `Pencarian: “${filters.search}”`]);
  return chips;
}
