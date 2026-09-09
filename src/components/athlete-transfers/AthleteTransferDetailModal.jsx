import { useEffect, useState } from 'react';
import { Download, FileText, Loader2, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { fetchAthleteTransferDocument, useAthleteTransfer, useCancelAthleteTransfer, useDestinationReviewAthleteTransfer, useKoniReviewAthleteTransfer } from '../../hooks/queries/useAthleteTransfers';
import { transferStatusLabel, transferStatusStyle } from './transferPresentation';

export function AthleteTransferDetailModal({ id, isOpen, onClose }) {
  const { user } = useAuth(); const { can } = usePermission();
  const { data: item, isLoading, refetch } = useAthleteTransfer(id, isOpen);
  const [decision, setDecision] = useState('accept'); const [reason, setReason] = useState(''); const [error, setError] = useState('');
  const [documentUrl, setDocumentUrl] = useState(''); const [documentLoading, setDocumentLoading] = useState(false);
  const destinationReview = useDestinationReviewAthleteTransfer(); const koniReview = useKoniReviewAthleteTransfer(); const cancelTransfer = useCancelAthleteTransfer();
  const orgId = Number(user?.organization_id || user?.organization?.id || 0);

  useEffect(() => () => { if (documentUrl) URL.revokeObjectURL(documentUrl); }, [documentUrl]);
  useEffect(() => { if (isOpen) { setDecision('accept'); setReason(''); setError(''); } }, [isOpen, id]);
  const close = () => {
    if (documentUrl) URL.revokeObjectURL(documentUrl);
    setDocumentUrl('');
    onClose();
  };
  if (!isOpen) return null;

  const canDestinationReview = item?.status === 'pending_destination' && can('athlete_transfers.receive') && orgId === item.destination_organization_id;
  const canKoniReview = item?.status === 'pending_koni' && can('athlete_transfers.approve');
  const canCancel = ['pending_destination', 'pending_koni'].includes(item?.status) && can('athlete_transfers.cancel') && orgId === item?.source_organization_id && Number(user?.id) === item?.submitted_by;
  const mutationPending = destinationReview.isPending || koniReview.isPending || cancelTransfer.isPending;

  const openDocument = async (download = false) => {
    setDocumentLoading(true); setError('');
    try { const blob = await fetchAthleteTransferDocument(id); const url = URL.createObjectURL(blob); if (download) { const anchor = document.createElement('a'); anchor.href = url; anchor.download = item.acceptance_letter_name || 'surat-penerimaan'; anchor.click(); URL.revokeObjectURL(url); } else { if (documentUrl) URL.revokeObjectURL(documentUrl); setDocumentUrl(url); } }
    catch { setError('Dokumen tidak dapat dibuka.'); } finally { setDocumentLoading(false); }
  };
  const submitReview = async () => {
    if (decision === 'reject' && !reason.trim()) { setError('Alasan penolakan wajib diisi.'); return; }
    setError(''); try { const mutation = canDestinationReview ? destinationReview : koniReview; await mutation.mutateAsync({ id, athleteId: item.athlete_id, decision, reason: reason.trim() }); await refetch(); setReason(''); } catch (err) { const blockers = err.response?.data?.blockers; setError(blockers?.length ? `Transfer diblokir: ${blockers.map((b) => b.event_name).join(', ')}` : err.response?.data?.message || 'Keputusan gagal diproses.'); }
  };
  const submitCancel = async () => { if (!reason.trim()) { setError('Alasan pembatalan wajib diisi.'); return; } try { await cancelTransfer.mutateAsync({ id, athleteId: item.athlete_id, reason: reason.trim() }); await refetch(); setReason(''); } catch (err) { setError(err.response?.data?.message || 'Pembatalan gagal diproses.'); } };

  return <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/60 p-4"><div className="mx-auto my-6 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
    <div className="flex items-center justify-between border-b p-5"><div><h2 className="text-lg font-bold">Detail Transfer Atlet</h2>{item && <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${transferStatusStyle(item.status)}`}>{transferStatusLabel(item.status)}</span>}</div><button onClick={close} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    {isLoading || !item ? <div className="p-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div> : <div className="space-y-5 p-5">
      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"><Info label="Atlet" value={item.athlete_name_snapshot} /><Info label="Cabor" value={item.cabor_name_snapshot} /><Info label="Organisasi Asal" value={item.source_organization_name_snapshot} /><Info label="Organisasi Tujuan" value={item.destination_organization_name_snapshot} /><Info label="Tanggal Efektif" value={formatDate(item.effective_date)} /><Info label="Diajukan Oleh" value={`${item.submitted_by_name || '-'} • ${formatDateTime(item.submitted_at)}`} /><div className="sm:col-span-2"><Info label="Alasan Pengajuan" value={item.reason} /></div></div>
      <div className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-red-600" /><div><p className="font-semibold">{item.acceptance_letter_name}</p><p className="text-xs text-slate-500">{Math.ceil(item.acceptance_letter_size / 1024)} KB</p></div></div><div className="flex gap-2"><button onClick={() => openDocument(false)} disabled={documentLoading} className="rounded-lg border px-3 py-2 text-sm font-semibold">Preview</button><button onClick={() => openDocument(true)} disabled={documentLoading} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold"><Download className="h-4 w-4" />Unduh</button></div></div>{documentUrl && (item.acceptance_letter_mime === 'application/pdf' ? <iframe title="Surat penerimaan" src={documentUrl} className="mt-4 h-[420px] w-full rounded-lg border" /> : <img src={documentUrl} alt="Surat penerimaan" className="mt-4 max-h-[520px] w-full rounded-lg border object-contain" />)}</div>
      <div><h3 className="mb-3 font-bold">Timeline</h3><div className="space-y-3 border-l-2 border-slate-200 pl-4">{item.actions?.map((action) => <div key={action.id}><p className="font-semibold text-slate-800">{transferStatusLabel(action.to_status)}</p><p className="text-xs text-slate-500">{action.actor_name_snapshot || 'Pengguna'} ({action.actor_role_snapshot || '-'}) • {formatDateTime(action.created_at)}</p>{action.notes && <p className="mt-1 text-sm text-slate-600">{action.notes}</p>}</div>)}</div></div>
      {(canDestinationReview || canKoniReview || canCancel) && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="font-bold text-amber-900">Tindakan</h3>{(canDestinationReview || canKoniReview) && <div className="mt-3 flex gap-4 text-sm"><label><input type="radio" checked={decision === 'accept'} onChange={() => setDecision('accept')} /> Terima</label><label><input type="radio" checked={decision === 'reject'} onChange={() => setDecision('reject')} /> Tolak</label></div>}<textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="3" placeholder={decision === 'reject' || canCancel ? 'Alasan wajib diisi' : 'Catatan (opsional)'} className="mt-3 w-full rounded-xl border px-3 py-2" />{error && <p className="mt-2 text-sm text-red-700">{error}</p>}<div className="mt-3 flex flex-wrap justify-end gap-2">{canCancel && <button disabled={mutationPending} onClick={submitCancel} className="rounded-xl border border-red-300 px-4 py-2 font-semibold text-red-700">Batalkan Pengajuan</button>}{(canDestinationReview || canKoniReview) && <button disabled={mutationPending} onClick={submitReview} className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white">Simpan Keputusan</button>}</div></div>}
      {!canDestinationReview && !canKoniReview && !canCancel && error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>}
  </div></div>;
}
function Info({ label, value }) { return <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-800">{value || '-'}</p></div>; }
function formatDate(value) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'; }
function formatDateTime(value) { return value ? new Date(value).toLocaleString('id-ID') : '-'; }
