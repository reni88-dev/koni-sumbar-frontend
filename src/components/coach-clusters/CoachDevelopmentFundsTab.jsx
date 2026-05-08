import { useMemo, useState } from 'react';
import { Edit2, Loader2, Plus, Trash2, Wallet } from 'lucide-react';
import { useCoachDevelopmentFunds, useDeleteCoachDevelopmentFund } from '../../hooks/queries/useCoachClusters';
import { usePermission } from '../../hooks/usePermission';
import { CoachDevelopmentFundModal } from './CoachDevelopmentFundModal';

export function CoachDevelopmentFundsTab({ coach, readOnly = false }) {
  const { can } = usePermission();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [modalFund, setModalFund] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading } = useCoachDevelopmentFunds(coach?.id, { year, perPage: 50 });
  const deleteMutation = useDeleteCoachDevelopmentFund();
  const funds = data?.data || [];
  const canView = readOnly || can('coach_development_funds.view');
  const canManage = !readOnly && can('coach_development_funds.manage');
  const total = useMemo(() => funds.reduce((sum, fund) => sum + Number(fund.amount || 0), 0), [funds]);

  if (!canView) return null;

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));

  const handleDelete = async (fund) => {
    if (!window.confirm('Hapus dana pembinaan ini?')) return;
    await deleteMutation.mutateAsync(fund.id);
  };

  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Wallet className="w-4 h-4 text-green-600" />Dana Pembinaan</h3>
        <div className="flex items-center gap-2">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none">
            {Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          {canManage && <button onClick={() => { setModalFund(null); setIsModalOpen(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"><Plus className="w-3.5 h-3.5" />Tambah Dana</button>}
        </div>
      </div>
      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100"><p className="text-xs text-green-700">Total tahun {year}</p><p className="text-lg font-bold text-green-800">{formatCurrency(data?.total_amount || total)}</p></div>
      {isLoading ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> : funds.length === 0 ? <p className="text-sm text-slate-500">Belum ada dana pembinaan pada tahun ini.</p> : (
        <div className="overflow-x-auto bg-white rounded-lg border border-slate-100"><table className="w-full text-sm"><thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="px-3 py-2 text-left">Tanggal</th><th className="px-3 py-2 text-left">Nominal</th><th className="px-3 py-2 text-left">Kluster</th><th className="px-3 py-2 text-left">Keterangan</th>{canManage && <th className="px-3 py-2 text-right">Aksi</th>}</tr></thead><tbody className="divide-y divide-slate-100">{funds.map((fund) => <tr key={fund.id}><td className="px-3 py-2 text-slate-700 whitespace-nowrap">{formatDate(fund.fund_date)}</td><td className="px-3 py-2 font-semibold text-slate-800 whitespace-nowrap">{formatCurrency(fund.amount)}</td><td className="px-3 py-2 text-slate-600 whitespace-nowrap">{fund.cluster_history?.sub_cluster_label || fund.cluster_history?.cluster_label || '-'}</td><td className="px-3 py-2 text-slate-600">{fund.description || '-'}</td>{canManage && <td className="px-3 py-2"><div className="flex items-center justify-end gap-1"><button onClick={() => { setModalFund(fund); setIsModalOpen(true); }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(fund)} disabled={deleteMutation.isPending} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button></div></td>}</tr>)}</tbody></table></div>
      )}
      <CoachDevelopmentFundModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} coach={coach} fund={modalFund} />
    </div>
  );
}
