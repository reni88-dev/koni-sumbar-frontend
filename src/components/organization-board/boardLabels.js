export const BOARD_SOURCE_LABELS = {
  athlete: 'Atlet',
  coach: 'Pelatih',
  person: 'Pengurus',
};

export const GENDER_LABELS = {
  male: 'Laki-laki',
  female: 'Perempuan',
};

export const DECREE_STATUS = {
  active: { label: 'Berlaku', className: 'bg-green-100 text-green-700' },
  expiring: { label: 'Segera berakhir', className: 'bg-amber-100 text-amber-700' },
  expired: { label: 'Kedaluwarsa', className: 'bg-slate-200 text-slate-600' },
};

export function formatDecreeDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-').map(Number);
  // Build a local date so a YYYY-MM-DD value never shifts a day across time zones.
  return new Date(year, month - 1, day).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
