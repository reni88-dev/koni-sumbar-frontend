import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Eye, Edit2, Trash2, ClipboardCheck, Loader2, AlertCircle,
  Calendar, Filter, ChevronDown, CheckCircle2, Users, FileText,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useMonevEvents, useMonevEventDelete } from '../hooks/useMonev';

function StatusBadge({ status }) {
  const colors = {
    draft: 'bg-slate-100 text-slate-600',
    active: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-600',
    archived: 'bg-violet-100 text-violet-600',
  };
  const labels = { draft: 'Draft', active: 'Aktif', closed: 'Ditutup', archived: 'Diarsipkan' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  );
}

export default function MonevEvents() {
  const navigate = useNavigate();
  const { data, loading, pagination, fetchData } = useMonevEvents();
  const { remove, loading: deleteLoading } = useMonevEventDelete();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchData({ page, search: debouncedSearch, status: statusFilter, per_page: 15 });
  }, [page, debouncedSearch, statusFilter, fetchData]);

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await remove(deleteModal.id);
      setDeleteModal(null);
      fetchData({ page, search: debouncedSearch, status: statusFilter, per_page: 15 });
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  return (
    <DashboardLayout title="Master Event Monev" subtitle="Kelola event monitoring & evaluasi">
      {/* Action Bar */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            <input type="text" placeholder="Cari event monev..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" /> Filter <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={() => navigate('/monev/events/create')}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">
              <Plus className="w-5 h-5" /> Buat Event Monev
            </button>
          </div>
        </div>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex gap-3">
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none">
              <option value="">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="active">Aktif</option>
              <option value="closed">Ditutup</option>
              <option value="archived">Diarsipkan</option>
            </select>
          </motion.div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-red-600 animate-spin" /></div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <ClipboardCheck className="w-12 h-12 mb-2" /><p>Belum ada event monev</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {data.map(event => (
                <div key={event.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{event.name}</div>
                      {event.description && <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{event.description}</div>}
                    </div>
                    <StatusBadge status={event.status} />
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" /><span>{event.total_items} Butir Monev</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4 text-slate-400 shrink-0" /><span>{event.total_assignees} Pemonev</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" /><span>{event.submission_count || 0} Submission</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                    <button onClick={() => navigate(`/monev/events/${event.id}`)} className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"><Eye className="w-4 h-4" /> Detail</button>
                    <button onClick={() => navigate(`/monev/events/${event.id}/edit`)} className="px-3 py-1.5 text-amber-600 hover:bg-amber-50 rounded-lg text-sm transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteModal(event)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <table className="w-full hidden md:table">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-600">Nama Event</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-600">Status</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-600">Butir</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-600">Pemonev</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-600">Submission</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-600">Periode</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map(event => (
                  <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-700">{event.name}</div>
                      {event.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{event.description}</div>}
                    </td>
                    <td className="py-4 px-4 text-center"><StatusBadge status={event.status} /></td>
                    <td className="py-4 px-4 text-center text-sm text-slate-600">{event.total_items}</td>
                    <td className="py-4 px-4 text-center text-sm text-slate-600">{event.total_assignees}</td>
                    <td className="py-4 px-4 text-center text-sm text-slate-600">{event.submission_count || 0}</td>
                    <td className="py-4 px-4 text-sm text-slate-500">
                      {event.start_date && <span>{new Date(event.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      {event.start_date && event.end_date && <span> — </span>}
                      {event.end_date && <span>{new Date(event.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => navigate(`/monev/events/${event.id}`)} className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Detail"><Eye className="w-4 h-4 text-blue-600" /></button>
                        <button onClick={() => navigate(`/monev/events/${event.id}/edit`)} className="p-2 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Edit2 className="w-4 h-4 text-amber-600" /></button>
                        <button onClick={() => setDeleteModal(event)} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 className="w-4 h-4 text-red-600" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
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
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-red-600" /></div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Event Monev?</h3>
                <p className="text-slate-500 text-sm mb-4">Event <strong>{deleteModal.name}</strong> akan dihapus permanen.</p>
                {deleteError && (<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{deleteError}</div>)}
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
