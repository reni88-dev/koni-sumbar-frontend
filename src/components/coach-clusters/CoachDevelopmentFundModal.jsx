import { useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { CalendarDays, Loader2, X } from 'lucide-react';
import { useCreateCoachDevelopmentFund, useUpdateCoachDevelopmentFund } from '../../hooks/queries/useCoachClusters';
import { getClusterErrorMessage } from '../../utils/clusterErrors';
import {
  formatDevelopmentPeriod,
  getLatestHistoricalDevelopmentDate,
  isDateInDevelopmentPeriods,
} from '../../utils/clusterDevelopment';
import { DateInput } from '../DateInput';

const onlyDigits = (value) => String(value || '').replace(/\D/g, '');
const formatThousands = (value) => onlyDigits(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const todayInJakarta = () => new Date(Date.now() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0];

export function CoachDevelopmentFundModal({
  isOpen,
  onClose,
  coach,
  fund,
  developmentPeriods = [],
  historicalOnly = false,
}) {
  const createMutation = useCreateCoachDevelopmentFund();
  const updateMutation = useUpdateCoachDevelopmentFund();
  const [form, setForm] = useState(() => {
    const defaultDate = historicalOnly ? getLatestHistoricalDevelopmentDate(developmentPeriods) : todayInJakarta();
    if (fund) {
      return { fund_date: fund.fund_date || defaultDate, amount: formatThousands(fund.amount ?? ''), description: fund.description || '' };
    }
    return { fund_date: defaultDate, amount: '', description: '' };
  });
  const [error, setError] = useState('');
  if (!isOpen || !coach) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isPending) return;
    setError('');
    const amount = Number(onlyDigits(form.amount));
    if (!form.fund_date) return setError('Tanggal biaya wajib diisi.');
    if (!isDateInDevelopmentPeriods(form.fund_date, developmentPeriods)) {
      return setError('Tanggal biaya tidak berada dalam periode Binaan. Pilih tanggal sesuai Riwayat Kluster.');
    }
    if (Number.isNaN(amount) || amount < 0) return setError('Nominal wajib berupa angka dan minimal 0.');

    try {
      const data = { fund_date: form.fund_date, amount, description: form.description };
      if (fund?.id) await updateMutation.mutateAsync({ id: fund.id, data });
      else await createMutation.mutateAsync({ coachId: coach.id, data });
      onClose();
    } catch (requestError) {
      setError(getClusterErrorMessage(requestError, 'Gagal menyimpan biaya pembinaan.', {
        permissionMessage: 'Anda tidak memiliki izin untuk mengelola biaya pembinaan.',
      }));
    }
  };

  return (
    <AnimatePresence>
      <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm" onClick={isPending ? undefined : onClose} />
      <Motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[61] flex items-center justify-center overflow-y-auto p-4">
        <form onSubmit={handleSubmit} className="my-4 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div><h3 className="text-lg font-bold text-slate-800">{fund ? 'Edit' : 'Tambah'} Biaya Pembinaan</h3><p className="text-sm text-slate-500">{coach.name}</p></div>
            <button type="button" onClick={onClose} disabled={isPending} className="rounded-lg p-2 transition-colors hover:bg-slate-100 disabled:opacity-50" aria-label="Tutup"><X className="h-5 w-5 text-slate-500" /></button>
          </div>
          <div className="max-h-[calc(100vh-12rem)] space-y-4 overflow-y-auto p-6">
            {historicalOnly && <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">Mode historis aktif. Pilih tanggal pada salah satu periode Binaan sebelumnya.</div>}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600"><CalendarDays className="h-4 w-4" />Periode Binaan yang diperbolehkan</p>
              {developmentPeriods.length ? (
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{developmentPeriods.map((period) => <li key={`${period.historyId ?? 'period'}-${period.startDate}`}>{formatDevelopmentPeriod(period)}</li>)}</ul>
              ) : (
                <p className="text-sm text-slate-500">Periode Binaan belum tersedia. Periksa Riwayat Kluster.</p>
              )}
            </div>
            {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <label className="block space-y-1"><span className="text-sm font-medium text-slate-700">Tanggal Biaya</span><DateInput value={form.fund_date} onChange={(event) => setForm({ ...form, fund_date: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-slate-700">Nominal</span><input type="text" inputMode="numeric" value={form.amount} onChange={(event) => setForm({ ...form, amount: formatThousands(event.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" placeholder="0" /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-slate-700">Keterangan</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" /></label>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button type="button" onClick={onClose} disabled={isPending} className="rounded-xl border border-slate-200 px-4 py-2.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50">Batal</button>
            <button type="submit" disabled={isPending || developmentPeriods.length === 0} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">{isPending && <Loader2 className="h-4 w-4 animate-spin" />}Simpan</button>
          </div>
        </form>
      </Motion.div>
    </AnimatePresence>
  );
}