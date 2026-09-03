import { useMemo, useState } from 'react';
import { AlertCircle, Edit2, Loader2, Plus, RefreshCw, Trash2, Wallet } from 'lucide-react';
import {
  useAthleteClusterHistories,
  useAthleteDevelopmentFunds,
  useDeleteAthleteDevelopmentFund,
} from '../../hooks/queries/useAthleteClusters';
import { usePermission } from '../../hooks/usePermission';
import { getClusterErrorMessage } from '../../utils/clusterErrors';
import { getDevelopmentEligibility, getDevelopmentPeriods } from '../../utils/clusterDevelopment';
import { DevelopmentFundEligibilityModal } from '../DevelopmentFundEligibilityModal';
import { AthleteDevelopmentFundModal } from './AthleteDevelopmentFundModal';

const EMPTY_LIST = [];

export function AthleteDevelopmentFundsTab({ athlete, onOpenClusterHistory }) {
  const { can } = usePermission();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [modalFund, setModalFund] = useState(null);
  const [historicalOnly, setHistoricalOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const fundsQuery = useAthleteDevelopmentFunds(athlete?.id, { year, perPage: 50 });
  const historiesQuery = useAthleteClusterHistories(athlete?.id);
  const deleteMutation = useDeleteAthleteDevelopmentFund();
  const funds = fundsQuery.data?.data || EMPTY_LIST;
  const histories = historiesQuery.data?.data || EMPTY_LIST;
  const canView = can('development_funds.view');
  const canManage = can('development_funds.manage');
  const eligibility = useMemo(() => getDevelopmentEligibility(histories), [histories]);
  const total = useMemo(() => funds.reduce((sum, fund) => sum + Number(fund.amount || 0), 0), [funds]);
  const fallbackPeriods = useMemo(
    () => getDevelopmentPeriods(modalFund?.cluster_history ? [modalFund.cluster_history] : []),
    [modalFund],
  );
  const modalPeriods = eligibility.developmentPeriods.length ? eligibility.developmentPeriods : fallbackPeriods;

  if (!canView) return null;

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));

  const openCreate = () => {
    if (historiesQuery.isLoading || historiesQuery.isError) return;
    setActionError('');
    setModalFund(null);
    if (eligibility.isCurrentlyDevelopment) {
      setHistoricalOnly(false);
      setIsModalOpen(true);
      return;
    }
    setIsEligibilityModalOpen(true);
  };

  const openHistoricalCreate = () => {
    setModalFund(null);
    setHistoricalOnly(true);
    setIsEligibilityModalOpen(false);
    setIsModalOpen(true);
  };

  const openEdit = (fund) => {
    setActionError('');
    setHistoricalOnly(false);
    setModalFund(fund);
    setIsModalOpen(true);
  };

  const closeFundModal = () => {
    setIsModalOpen(false);
    setModalFund(null);
    setHistoricalOnly(false);
  };

  const handleDelete = async (fund) => {
    if (!window.confirm('Hapus biaya pembinaan ini?')) return;
    setActionError('');
    try {
      await deleteMutation.mutateAsync(fund.id);
    } catch (error) {
      setActionError(getClusterErrorMessage(error, 'Gagal menghapus biaya pembinaan.', {
        permissionMessage: 'Anda tidak memiliki izin untuk mengelola biaya pembinaan.',
      }));
    }
  };

  const openClusterHistory = () => {
    setIsEligibilityModalOpen(false);
    onOpenClusterHistory?.();
  };

  const statusUnavailable = historiesQuery.isError;
  const statusChecking = historiesQuery.isLoading;

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Wallet className="h-4 w-4 text-green-600" />
          Biaya Pembinaan
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <select value={year} onChange={(event) => setYear(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100">
            {Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              disabled={statusChecking || statusUnavailable}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {statusChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {statusChecking ? 'Memeriksa Status...' : statusUnavailable ? 'Status Tidak Tersedia' : 'Tambah Biaya'}
            </button>
          )}
        </div>
      </div>

      {statusUnavailable && canManage && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />Status Kluster belum dapat diperiksa. Penambahan biaya dinonaktifkan sementara.</span>
          <button type="button" onClick={() => historiesQuery.refetch()} disabled={historiesQuery.isFetching} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${historiesQuery.isFetching ? 'animate-spin' : ''}`} /> Coba Lagi
          </button>
        </div>
      )}

      {actionError && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}

      <div className="mb-4 rounded-lg border border-green-100 bg-green-50 p-3">
        <p className="text-xs text-green-700">Total tahun {year}</p>
        <p className="text-lg font-bold text-green-800">{formatCurrency(fundsQuery.data?.total_amount ?? total)}</p>
      </div>

      {fundsQuery.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : fundsQuery.isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <p>{getClusterErrorMessage(fundsQuery.error, 'Biaya pembinaan belum dapat dimuat.')}</p>
          <button type="button" onClick={() => fundsQuery.refetch()} disabled={fundsQuery.isFetching} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${fundsQuery.isFetching ? 'animate-spin' : ''}`} /> Coba Lagi
          </button>
        </div>
      ) : funds.length === 0 ? (
        <p className="text-sm text-slate-500">Belum ada biaya pembinaan pada tahun ini.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Tanggal</th>
                <th className="px-3 py-2 text-left">Nominal</th>
                <th className="px-3 py-2 text-left">Kluster</th>
                <th className="px-3 py-2 text-left">Keterangan</th>
                {canManage && <th className="px-3 py-2 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {funds.map((fund) => (
                <tr key={fund.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">{formatDate(fund.fund_date)}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-800">{formatCurrency(fund.amount)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">{fund.cluster_history?.sub_cluster_label || fund.cluster_history?.cluster_label || '-'}</td>
                  <td className="px-3 py-2 text-slate-600">{fund.description || '-'}</td>
                  {canManage && (
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => openEdit(fund)} disabled={deleteMutation.isPending} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 disabled:opacity-50" title="Edit">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDelete(fund)} disabled={deleteMutation.isPending} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Hapus">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && <AthleteDevelopmentFundModal
        isOpen={isModalOpen}
        onClose={closeFundModal}
        athlete={athlete}
        fund={modalFund}
        developmentPeriods={modalPeriods}
        historicalOnly={historicalOnly}
      />}
      <DevelopmentFundEligibilityModal
        isOpen={isEligibilityModalOpen}
        onClose={() => setIsEligibilityModalOpen(false)}
        onRecordHistorical={openHistoricalCreate}
        onOpenClusterHistory={openClusterHistory}
        personName={athlete.name}
        personType="atlet"
        hasHistoricalPeriods={eligibility.developmentPeriods.some((period) => period.endDate)}
      />
    </div>
  );
}