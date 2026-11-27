export const LEVEL_LABELS = {
  kabkota: 'Kabupaten/Kota',
  provinsi: 'Provinsi',
  nasional: 'Nasional',
  internasional: 'Internasional',
};

export const CATEGORY_LABELS = { individual: 'Perorangan', team: 'Beregu' };

export const RESULT_LABELS = {
  gold: 'Medali Emas',
  silver: 'Medali Perak',
  bronze: 'Medali Perunggu',
  rank: 'Peringkat',
  participant: 'Peserta',
};

export const STATUS_META = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
  submitted: { label: 'Menunggu Verifikasi', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  approved: { label: 'Terverifikasi', className: 'bg-green-50 text-green-700 ring-green-200' },
  rejected: { label: 'Ditolak', className: 'bg-red-50 text-red-700 ring-red-200' },
};

export const EVENT_SUGGESTIONS = [
  'PON', 'POPNAS', 'POPDA', 'POPWIL', 'Kejurnas', 'Kejurda',
  'SEA Games', 'Asian Games', 'Olimpiade',
];

export const MAX_EVIDENCE_FILES = 5;
export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_EVIDENCE = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

export const isEditableStatus = (status) => status === 'draft' || status === 'rejected';

export const formatResult = (item) => (
  item.result === 'rank' ? `Peringkat ${item.rank}` : (RESULT_LABELS[item.result] || item.result)
);

const formatDay = (value) => (
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
);

export const formatPeriod = (item) => (
  item.end_date && item.end_date !== item.start_date
    ? `${formatDay(item.start_date)} - ${formatDay(item.end_date)}`
    : formatDay(item.start_date)
);

// One-line summary used on profile screens and the printed profile.
export const summarizeAchievement = (item) => (
  [
    `${formatResult(item)} - ${item.event_name} (${item.start_date?.slice(0, 4)})`,
    [item.cabor_name, item.competition_class].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ')
);
