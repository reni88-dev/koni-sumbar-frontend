export const transferStatusLabel = (status) => ({
  pending_destination: 'Menunggu Persetujuan Tujuan', pending_koni: 'Menunggu Persetujuan KONI Sumbar',
  completed: 'Selesai', rejected_destination: 'Ditolak Tujuan', rejected_koni: 'Ditolak KONI Sumbar', cancelled: 'Dibatalkan',
}[status] || status || '-');
export const transferStatusStyle = (status) => ({
  pending_destination: 'bg-amber-100 text-amber-800', pending_koni: 'bg-blue-100 text-blue-800', completed: 'bg-emerald-100 text-emerald-800',
  rejected_destination: 'bg-red-100 text-red-800', rejected_koni: 'bg-red-100 text-red-800', cancelled: 'bg-slate-200 text-slate-700',
}[status] || 'bg-slate-100 text-slate-700');
