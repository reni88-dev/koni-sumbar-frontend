export const transferStatusLabel = (status) => ({
  pending_destination: 'Menunggu Persetujuan Tujuan',
  pending_koni: 'Menunggu Persetujuan KONI Sumbar',
  completed: 'Selesai',
  rejected_destination: 'Ditolak Tujuan',
  rejected_koni: 'Ditolak KONI Sumbar',
  cancelled: 'Dibatalkan',
}[status] || status || '-');

export const transferStatusStyle = (status) => ({
  pending_destination: 'border-amber-200 bg-amber-50 text-amber-700',
  pending_koni: 'border-blue-200 bg-blue-50 text-blue-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected_destination: 'border-red-200 bg-red-50 text-red-700',
  rejected_koni: 'border-red-200 bg-red-50 text-red-700',
  cancelled: 'border-slate-300 bg-slate-100 text-slate-600',
}[status] || 'border-slate-200 bg-slate-50 text-slate-600');
