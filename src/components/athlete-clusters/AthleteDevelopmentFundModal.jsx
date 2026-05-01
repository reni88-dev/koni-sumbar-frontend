import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { useCreateAthleteDevelopmentFund, useUpdateAthleteDevelopmentFund } from '../../hooks/queries/useAthleteClusters';
import { DateInput } from '../DateInput';

const onlyDigits = (value) => String(value || '').replace(/\D/g, '');
const formatThousands = (value) => onlyDigits(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function AthleteDevelopmentFundModal({ isOpen, onClose, athlete, fund }) {
  const createMutation = useCreateAthleteDevelopmentFund();
  const updateMutation = useUpdateAthleteDevelopmentFund();
  const [form, setForm] = useState({ fund_date: new Date().toISOString().split('T')[0], amount: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (fund) {
      setForm({
        fund_date: fund.fund_date || new Date().toISOString().split('T')[0],
        amount: formatThousands(fund.amount ?? ''),
        description: fund.description || '',
      });
    } else {
      setForm({ fund_date: new Date().toISOString().split('T')[0], amount: '', description: '' });
    }
    setError('');
  }, [fund, isOpen]);

  if (!isOpen || !athlete) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const amount = Number(onlyDigits(form.amount));
    if (!form.fund_date) return setError('Tanggal biaya wajib diisi.');
    if (Number.isNaN(amount) || amount < 0) return setError('Nominal wajib berupa angka dan minimal 0.');

    const data = { fund_date: form.fund_date, amount, description: form.description };
    try {
      if (fund?.id) {
        await updateMutation.mutateAsync({ id: fund.id, data });
      } else {
        await createMutation.mutateAsync({ athleteId: athlete.id, data });
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan biaya pembinaan.');
    }
  };

  const handleAmountChange = (event) => {
    setForm({ ...form, amount: formatThousands(event.target.value) });
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{fund ? 'Edit' : 'Tambah'} Biaya Pembinaan</h3>
              <p className="text-sm text-slate-500">{athlete.name}</p>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
            <label className="space-y-1 block">
              <span className="text-sm font-medium text-slate-700">Tanggal Biaya</span>
              <DateInput value={form.fund_date} onChange={(e) => setForm({ ...form, fund_date: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" />
            </label>
            <label className="space-y-1 block">
              <span className="text-sm font-medium text-slate-700">Nominal</span>
              <input type="text" inputMode="numeric" value={form.amount} onChange={handleAmountChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" placeholder="0" />
            </label>
            <label className="space-y-1 block">
              <span className="text-sm font-medium text-slate-700">Keterangan</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" />
            </label>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">Batal</button>
            <button type="submit" disabled={isPending} className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
