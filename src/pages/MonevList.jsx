import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Eye, Edit2, Trash2, ClipboardCheck, Loader2, AlertCircle,
  Calendar, MapPin, Filter, ChevronDown,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { SearchableSelect } from '../components/SearchableSelect';
import { useMonevList, useMonevDelete } from '../hooks/useMonev';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';


function ScoreBadge({ score, total = 15 }) {
  const pct = Math.round((score / total) * 100);
  const color = pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
      {score}/{total} <span className="font-normal">({pct}%)</span>
    </span>
  );
}

export default function MonevList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, pagination, fetchData } = useMonevList();
  const { remove, loading: deleteLoading } = useMonevDelete();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [caborId, setCaborId] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [cabors, setCabors] = useState([]);
  const [creators, setCreators] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const isAdminMonev = user?.role?.name === 'admin_monev';

  useEffect(() => {
    api.get('/api/cabors/all').then(r => setCabors(r.data || [])).catch(() => {});
    if (!isAdminMonev) {
      api.get('/api/monev/creators').then(r => setCreators(r.data || [])).catch(() => {});
    }
  }, [isAdminMonev]);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchData({ page, search: debouncedSearch, cabor_id: caborId, created_by: createdBy, per_page: 15 });
  }, [page, debouncedSearch, caborId, createdBy, fetchData]);

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await remove(deleteModal.id);
      setDeleteModal(null);
      fetchData({ page, search: debouncedSearch, cabor_id: caborId, created_by: createdBy, per_page: 15 });
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  return (
    <DashboardLayout title="Monitoring & Evaluasi" subtitle="Monitoring latihan PLATPROV Atlet Sumatera Barat">
      {/* Action Bar */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text" placeholder="Cari cabor, venue, pelatih..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" /> Filter <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={() => navigate('/monev/create')}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">
              <Plus className="w-5 h-5" /> Buat Monitoring
            </button>
          </div>
        </div>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex gap-3">
            <div className="w-64">
              <SearchableSelect
                options={cabors}
                value={caborId}
                onChange={val => { setCaborId(val); setPage(1); }}
                placeholder="Semua Cabor"
              />
            </div>
            {!isAdminMonev && (
              <div className="w-64">
                <SearchableSelect
                  options={creators}
                  value={createdBy}
                  onChange={val => { setCreatedBy(val); setPage(1); }}
                  placeholder="Semua Pemonitor"
                />
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <ClipboardCheck className="w-12 h-12 mb-2" />
            <p>Belum ada data monitoring</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {data.map(entry => (
                <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-slate-800 text-base">{entry.cabor_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{entry.venue_name}</div>
                    </div>
                    <ScoreBadge score={entry.total_score} />
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{new Date(entry.monitoring_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} {entry.start_time && <span className="text-slate-400 ml-1">{entry.start_time} - {entry.end_time}</span>}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <span>Pelatih: {entry.coach_name || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <ClipboardCheck className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Oleh: {entry.creator_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                    <button onClick={() => navigate(`/monev/${entry.id}`)} className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"><Eye className="w-4 h-4" /> Detail</button>
                    {(isAdminMonev || user?.role?.name === 'Super Admin' || user?.role?.name === 'admin') && (
                      <button onClick={() => navigate(`/monev/${entry.id}/edit`)} className="px-3 py-1.5 text-amber-600 hover:bg-amber-50 rounded-lg text-sm transition-colors"><Edit2 className="w-4 h-4" /></button>
                    )}
                    {(isAdminMonev || user?.role?.name === 'Super Admin' || user?.role?.name === 'admin') && (
                      <button onClick={() => setDeleteModal(entry)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <table className="w-full hidden md:table">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-600">Tanggal</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-600">Cabor</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-600">Venue</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-600">Pelatih</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-600">Skor</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-600">Pemonitor</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map(entry => (
                  <tr key={`desk-${entry.id}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {new Date(entry.monitoring_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {entry.start_time && <div className="text-xs text-slate-400 ml-6">{entry.start_time} - {entry.end_time}</div>}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700">{entry.cabor_name}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm">{entry.venue_name}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm">{entry.coach_name || '-'}</td>
                    <td className="py-4 px-4 text-center"><ScoreBadge score={entry.total_score} /></td>
                    <td className="py-4 px-4 text-slate-600 text-sm">{entry.creator_name}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => navigate(`/monev/${entry.id}`)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Detail">
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        <button onClick={() => navigate(`/monev/${entry.id}/edit`)}
                          className="p-2 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4 text-amber-600" />
                        </button>
                        <button onClick={() => setDeleteModal(entry)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">Menampilkan {data.length} dari {pagination.total} data</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors">Sebelumnya</button>
              <button onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))} disabled={page === pagination.last_page}
                className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors">Selanjutnya</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={() => { setDeleteModal(null); setDeleteError(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Data Monitoring?</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Monitoring <strong>{deleteModal.cabor_name}</strong> tanggal <strong>{deleteModal.monitoring_date}</strong> akan dihapus permanen.
                </p>
                {deleteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{deleteError}</div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => { setDeleteModal(null); setDeleteError(null); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">Batal</button>
                  <button onClick={handleDelete} disabled={deleteLoading}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
                    {deleteLoading ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
