import { ArrowRight, Loader2 } from 'lucide-react';
import { useAthleteTransferHistory } from '../../hooks/queries/useAthleteTransfers';
import { transferStatusLabel, transferStatusStyle } from './transferPresentation';

export function AthleteTransferHistory({ athleteId }) {
  const { data = [], isLoading, isError } = useAthleteTransferHistory(athleteId);
  if (isLoading) return <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (isError) return <div className="rounded-xl bg-red-50 p-4 text-red-700">Riwayat transfer gagal dimuat.</div>;
  if (!data.length) return <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">Belum ada riwayat transfer Atlet.</div>;
  return <div className="space-y-3">{data.map((item) => <div key={item.id} className="rounded-2xl border bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm"><span>{item.source_organization_name_snapshot}</span><ArrowRight className="h-4 w-4 text-slate-400" /><span className="font-bold">{item.destination_organization_name_snapshot}</span></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${transferStatusStyle(item.status)}`}>{transferStatusLabel(item.status)}</span></div><p className="mt-2 text-xs text-slate-500">Tanggal efektif {new Date(`${item.effective_date}T00:00:00`).toLocaleDateString('id-ID')} • diajukan {new Date(item.submitted_at).toLocaleString('id-ID')}</p>{item.status === 'completed' && <p className="mt-2 text-sm font-semibold text-emerald-700">Perpindahan organisasi selesai.</p>}{item.cancellation_reason && <p className="mt-2 text-sm text-slate-600">Alasan pembatalan: {item.cancellation_reason}</p>}{item.destination_review_reason && item.status === 'rejected_destination' && <p className="mt-2 text-sm text-red-700">Alasan penolakan: {item.destination_review_reason}</p>}{item.koni_review_reason && item.status === 'rejected_koni' && <p className="mt-2 text-sm text-red-700">Alasan penolakan: {item.koni_review_reason}</p>}</div>)}</div>;
}
