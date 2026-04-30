import { useState } from 'react';
import { FileText, History, Layers, Loader2, Plus } from 'lucide-react';
import { useAthleteClusterHistories } from '../../hooks/queries/useAthleteClusters';
import { usePermission } from '../../hooks/usePermission';
import { AthleteClusterMoveModal } from './AthleteClusterMoveModal';
import { changeTypeLabel } from './athleteClusterConstants';

export function AthleteClusterHistoryTab({ athlete }) {
  const { can, canAny } = usePermission();
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const { data, isLoading } = useAthleteClusterHistories(athlete?.id);
  const histories = data?.data || [];
  const activeHistory = histories.find((item) => !item.end_date);
  const canManage = can('athlete_clusters.manage');
  const canView = canAny(['athlete_clusters.view', 'athletes.view']);

  if (!canView) return null;

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          Riwayat Kluster
        </h3>
        {canManage && (
          <button onClick={() => setIsMoveModalOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Ubah Kluster
          </button>
        )}
      </div>

      <div className="mb-4 p-3 bg-white rounded-lg border border-slate-100">
        <p className="text-xs text-slate-500 mb-1">Status Aktif</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${activeHistory?.cluster_type === 'koni_development' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
            {activeHistory?.cluster_label || athlete.current_cluster_label || 'Atlet Non Binaan'}
          </span>
          {(activeHistory?.sub_cluster_label || athlete.current_sub_cluster_label) && (
            <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
              {activeHistory?.sub_cluster_label || athlete.current_sub_cluster_label}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : histories.length === 0 ? (
        <p className="text-sm text-slate-500">Belum ada riwayat kluster.</p>
      ) : (
        <div className="space-y-3">
          {histories.map((history) => (
            <div key={history.id} className="p-3 bg-white rounded-lg border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-slate-800">{history.cluster_label}</span>
                    {history.sub_cluster_label && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{history.sub_cluster_label}</span>}
                    {!history.end_date && <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">Aktif</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(history.start_date)} - {history.end_date ? formatDate(history.end_date) : 'Sekarang'}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <History className="w-3.5 h-3.5" />
                  {history.change_label || changeTypeLabel(history.change_type)}
                </span>
              </div>
              {history.reason && <p className="text-sm text-slate-600 mb-2">{history.reason}</p>}
              <div className="grid md:grid-cols-3 gap-2 text-xs text-slate-500">
                <span>SK: <strong className="text-slate-700">{history.decree?.decree_number || '-'}</strong></span>
                <span>Tgl SK: <strong className="text-slate-700">{formatDate(history.decree?.decree_date)}</strong></span>
                <span>Dibuat: <strong className="text-slate-700">{history.created_by_user?.name || '-'}</strong></span>
              </div>
              {history.decree?.file_url && (
                <a href={history.decree.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                  <FileText className="w-3.5 h-3.5" />
                  Lihat File SK
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <AthleteClusterMoveModal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} athlete={athlete} />
    </div>
  );
}
