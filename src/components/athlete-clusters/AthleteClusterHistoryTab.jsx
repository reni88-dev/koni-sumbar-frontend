import { useState } from 'react';
import { AlertCircle, FileText, History, Layers, Loader2, Plus, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useAthleteClusterHistories } from '../../hooks/queries/useAthleteClusters';
import { usePermission } from '../../hooks/usePermission';
import { getClusterErrorMessage } from '../../utils/clusterErrors';
import { AthleteClusterMoveModal } from './AthleteClusterMoveModal';
import { changeTypeLabel } from './athleteClusterConstants';

export function AthleteClusterHistoryTab({ athlete }) {
  const { can, canAny } = usePermission();
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const historiesQuery = useAthleteClusterHistories(athlete?.id);
  const histories = historiesQuery.data?.data || [];
  const activeHistory = histories.find((item) => !item.end_date);
  const canManage = can('athlete_clusters.manage');
  const canView = canAny(['athlete_clusters.view', 'athletes.view']);

  if (!canView) return null;

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleOpenDecreeFile = async (fileUrl) => {
    try {
      const response = await api.get(fileUrl, { responseType: 'blob' });
      const objectUrl = window.URL.createObjectURL(response.data);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      window.alert(getClusterErrorMessage(error, 'Gagal membuka file SK. Silakan coba lagi.'));
    }
  };

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Layers className="h-4 w-4 text-blue-600" />Riwayat Kluster</h3>
        {canManage && <button type="button" onClick={() => setIsMoveModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"><Plus className="h-3.5 w-3.5" />Ubah Kluster</button>}
      </div>

      {historiesQuery.isError ? (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <p className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{getClusterErrorMessage(historiesQuery.error, 'Riwayat Kluster belum dapat dimuat.')}</p>
          <button type="button" onClick={() => historiesQuery.refetch()} disabled={historiesQuery.isFetching} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${historiesQuery.isFetching ? 'animate-spin' : ''}`} />Coba Lagi</button>
        </div>
      ) : (
        <div className="mb-4 rounded-lg border border-slate-100 bg-white p-3">
          <p className="mb-1 text-xs text-slate-500">Status Aktif</p>
          {historiesQuery.isLoading ? (
            <span className="inline-flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Memeriksa status Kluster...</span>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${activeHistory?.is_development_cluster ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                {activeHistory?.cluster_label || 'Atlet Non Binaan'}
              </span>
              {activeHistory?.sub_cluster_label && <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">{activeHistory.sub_cluster_label}</span>}
            </div>
          )}
        </div>
      )}

      {historiesQuery.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : historiesQuery.isError ? null : histories.length === 0 ? (
        <p className="text-sm text-slate-500">Belum ada riwayat Kluster.</p>
      ) : (
        <div className="space-y-3">
          {histories.map((history) => (
            <div key={history.id} className="rounded-lg border border-slate-100 bg-white p-3">
              <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-slate-800">{history.cluster_label}</span>{history.sub_cluster_label && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{history.sub_cluster_label}</span>}{!history.end_date && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Aktif</span>}</div><p className="mt-1 text-xs text-slate-500">{formatDate(history.start_date)} - {history.end_date ? formatDate(history.end_date) : 'Sekarang'}</p></div>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500"><History className="h-3.5 w-3.5" />{history.change_label || changeTypeLabel(history.change_type)}</span>
              </div>
              {history.reason && <p className="mb-2 text-sm text-slate-600">{history.reason}</p>}
              <div className="grid gap-2 text-xs text-slate-500 md:grid-cols-3"><span>SK: <strong className="text-slate-700">{history.decree?.decree_number || '-'}</strong></span><span>Tgl SK: <strong className="text-slate-700">{formatDate(history.decree?.decree_date)}</strong></span><span>Dibuat: <strong className="text-slate-700">{history.created_by_user?.name || '-'}</strong></span></div>
              {history.decree?.file_url && <button type="button" onClick={() => handleOpenDecreeFile(history.decree.file_url)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"><FileText className="h-3.5 w-3.5" />Lihat File SK</button>}
            </div>
          ))}
        </div>
      )}

      {isMoveModalOpen && <AthleteClusterMoveModal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} athlete={athlete} />}
    </div>
  );
}