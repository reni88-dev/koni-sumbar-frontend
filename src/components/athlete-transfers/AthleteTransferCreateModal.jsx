import { useState } from 'react';
import { FileUp, Loader2, X } from 'lucide-react';
import { useAthleteTransferDestinations, useCreateAthleteTransfer } from '../../hooks/queries/useAthleteTransfers';

const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const todayJakarta = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function AthleteTransferCreateModal({ athlete, isOpen, onClose, onSuccess }) {
  const [destinationId, setDestinationId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(todayJakarta());
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const { data: destinations = [], isLoading } = useAthleteTransferDestinations(athlete?.id, isOpen);
  const mutation = useCreateAthleteTransfer();


  const close = () => {
    setDestinationId(''); setEffectiveDate(todayJakarta()); setReason(''); setFile(null); setError('');
    onClose();
  };
  if (!isOpen || !athlete) return null;

  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (!destinationId || !effectiveDate || !reason.trim() || !file) { setError('Lengkapi tujuan, tanggal efektif, alasan, dan surat penerimaan.'); return; }
    if (effectiveDate > todayJakarta()) { setError('Tanggal efektif tidak boleh melebihi hari ini.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Ukuran surat maksimal 10 MB.'); return; }
    if (!allowedTypes.includes(file.type)) { setError('Surat harus berupa PDF, JPG, PNG, atau WebP.'); return; }
    const data = new FormData();
    data.append('athlete_id', athlete.id); data.append('destination_organization_id', destinationId);
    data.append('effective_date', effectiveDate); data.append('reason', reason.trim()); data.append('acceptance_letter', file);
    try { const item = await mutation.mutateAsync(data); onSuccess?.(item); close(); }
    catch (err) { setError(err.response?.data?.message || 'Pengajuan transfer gagal dikirim.'); }
  };

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
    <form onSubmit={submit} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b p-5"><div><h2 className="text-lg font-bold text-slate-900">Ajukan Transfer Atlet</h2><p className="text-sm text-slate-500">Organisasi baru berlaku setelah persetujuan final KONI Sumbar.</p></div><button type="button" onClick={close} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
      <div className="space-y-4 p-5">
        <div className="rounded-xl bg-slate-50 p-4 text-sm"><p className="font-bold text-slate-800">{athlete.name}</p><p className="text-slate-500">Asal: {athlete.organization?.name || athlete.organization_name || '-'}</p><p className="text-slate-500">Cabor: {athlete.cabor?.display_name || athlete.cabor?.name || '-'}</p></div>
        <label className="block text-sm font-semibold text-slate-700">KONI Kab/Kota Tujuan<select value={destinationId} onChange={(e) => setDestinationId(e.target.value)} disabled={isLoading} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"><option value="">{isLoading ? 'Memuat...' : 'Pilih tujuan'}</option>{destinations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
        <label className="block text-sm font-semibold text-slate-700">Tanggal Efektif<input type="date" max={todayJakarta()} value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
        <label className="block text-sm font-semibold text-slate-700">Alasan Pengajuan<textarea rows="4" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Jelaskan alasan transfer atlet" /></label>
        <label className="block rounded-xl border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-600 hover:border-red-300"><FileUp className="mx-auto mb-2 h-6 w-6" />{file ? file.name : 'Pilih surat penerimaan (maks. 10 MB)'}<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      </div>
      <div className="flex justify-end gap-3 border-t p-5"><button type="button" onClick={close} className="rounded-xl border px-4 py-2.5 font-semibold">Batal</button><button disabled={mutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">{mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Kirim Pengajuan</button></div>
    </form>
  </div>;
}
