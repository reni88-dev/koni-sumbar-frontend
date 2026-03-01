// Shared status constants for training feature
export const STATUS_LABELS = {
  scheduled: { label: 'Terjadwal', color: 'bg-blue-100 text-blue-700' },
  ongoing: { label: 'Berlangsung', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Selesai', color: 'bg-green-100 text-green-700' },
};

export const ATTENDANCE_STATUS_COLORS = {
  present: 'bg-green-100 text-green-700 border-green-200',
  absent: 'bg-red-100 text-red-700 border-red-200',
  sick: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  permission: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const ATTENDANCE_STATUS_LABELS = {
  present: 'Hadir',
  absent: 'Tidak Hadir',
  sick: 'Sakit',
  permission: 'Izin',
};
