import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Medal,
  Loader2,
  AlertCircle,
  Filter
} from 'lucide-react';
import api from '../../api/axios';
import { DashboardLayout } from '../../components/DashboardLayout';
import { CompetitionClassFormModal } from '../../components/CompetitionClassFormModal';

export function CompetitionClassesPage() {
  const [competitionClasses, setCompetitionClasses] = useState([]);
  const [cabors, setCabors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCabor, setFilterCabor] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  // Fetch cabors for dropdown
  const fetchCabors = async () => {
    try {
      const response = await api.get('/api/master/cabors/all');
      setCabors(response.data);
    } catch (error) {
      console.error('Failed to fetch cabors:', error);
    }
  };

  // Fetch competition classes
  const fetchCompetitionClasses = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, search, per_page: 20 };
      if (filterCabor) params.cabor_id = filterCabor;
      
      const response = await api.get('/api/master/competition-classes', { params });
      setCompetitionClasses(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total
      });
    } catch (error) {
      console.error('Failed to fetch competition classes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCabors();
    fetchCompetitionClasses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompetitionClasses(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterCabor]);

  // Open modal for create
  const openCreateModal = () => {
    setSelectedClass(null);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const openEditModal = (item) => {
    setSelectedClass(item);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
  };

  // Handle successful save
  const handleSaveSuccess = () => {
    fetchCompetitionClasses(pagination.current_page);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await api.delete(`/api/master/competition-classes/${classToDelete.id}`);
      setIsDeleteModalOpen(false);
      setClassToDelete(null);
      fetchCompetitionClasses(pagination.current_page);
    } catch (error) {
      console.error('Failed to delete competition class:', error);
      alert(error.response?.data?.message || 'Gagal menghapus data');
    }
  };

  return (
    <DashboardLayout title="Kelas Pertandingan" subtitle="Kelola data kelas pertandingan per cabang olahraga">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative max-w-xs">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
            />
          </div>
          <div className="relative max-w-xs">
            <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            <select
              value={filterCabor}
              onChange={(e) => setFilterCabor(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none appearance-none"
            >
              <option value="">Semua Cabor</option>
              {cabors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Kelas</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cabor</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kode</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Kelas</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Atlet</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
                  </td>
                </tr>
              ) : competitionClasses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data kelas pertandingan
                  </td>
                </tr>
              ) : (
                competitionClasses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                        {item.cabor?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.code ? (
                        <span className="px-3 py-1 bg-slate-100 rounded-lg font-mono text-sm font-medium text-slate-700">
                          {item.code}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Medal className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <span className="font-medium text-slate-800">{item.name}</span>
                          {item.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 font-medium">{item.athletes_count || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setClassToDelete(item); setIsDeleteModalOpen(true); }}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Menampilkan {competitionClasses.length} dari {pagination.total} data
            </p>
            <div className="flex gap-2">
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => fetchCompetitionClasses(page)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    page === pagination.current_page
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <CompetitionClassFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        competitionClass={selectedClass}
        cabors={cabors}
        onSuccess={handleSaveSuccess}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Kelas?</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Anda yakin ingin menghapus kelas <strong>{classToDelete?.name}</strong>?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                  >
                    Hapus
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
