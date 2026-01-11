import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Medal,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2
} from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { CompetitionClassFormModal } from '../../components/CompetitionClassFormModal';
import { useCaborsAll } from '../../hooks/queries/useCabors';
import { 
  useCompetitionClasses, 
  useDeleteCompetitionClass 
} from '../../hooks/queries/useMasterData';

export function CompetitionClassesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCabor, setFilterCabor] = useState('');
  const [page, setPage] = useState(1);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  // TanStack Query hooks
  const { data: cabors = [] } = useCaborsAll();
  const { 
    data: classesData, 
    isLoading: loading,
    refetch 
  } = useCompetitionClasses({ 
    page, 
    search: debouncedSearch, 
    caborId: filterCabor 
  });
  const deleteMutation = useDeleteCompetitionClass();

  const competitionClasses = classesData?.data || [];
  const pagination = {
    current_page: classesData?.current_page || 1,
    last_page: classesData?.last_page || 1,
    total: classesData?.total || 0
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filterCabor]);

  const openCreateModal = () => {
    setSelectedClass(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedClass(item);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
  };

  const handleSaveSuccess = () => {
    refetch();
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(classToDelete.id);
      setIsDeleteModalOpen(false);
      setClassToDelete(null);
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
        {
          pagination.last_page > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Menampilkan <span className="font-medium text-slate-900">{competitionClasses.length}</span> dari <span className="font-medium text-slate-900">{pagination.total}</span> data
              </p>
              
              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  onClick={() => setPage(1)}
                  disabled={pagination.current_page === 1}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                  title="Halaman Pertama"
                >
                  <ChevronsLeft className="w-5 h-5" />
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => setPage(Math.max(1, pagination.current_page - 1))}
                  disabled={pagination.current_page === 1}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                  title="Sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 mx-2">
                  {(() => {
                    const current = pagination.current_page;
                    const last = pagination.last_page;
                    const delta = 1;
                    const left = current - delta;
                    const right = current + delta + 1;
                    const range = [];
                    const rangeWithDots = [];
                    let l;

                    for (let i = 1; i <= last; i++) {
                      if (i === 1 || i === last || (i >= left && i < right)) {
                        range.push(i);
                      }
                    }

                    for (const i of range) {
                      if (l) {
                        if (i - l === 2) {
                          rangeWithDots.push(l + 1);
                        } else if (i - l !== 1) {
                          rangeWithDots.push('...');
                        }
                      }
                      rangeWithDots.push(i);
                      l = i;
                    }

                    return rangeWithDots.map((pageNum, idx) => (
                      pageNum === '...' ? (
                        <span key={`dots-${idx}`} className="px-2 text-slate-400">...</span>
                      ) : (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                            pageNum === pagination.current_page
                              ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    ));
                  })()}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => setPage(Math.min(pagination.last_page, pagination.current_page + 1))}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                  title="Selanjutnya"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setPage(pagination.last_page)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                  title="Halaman Terakhir"
                >
                  <ChevronsRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )
        }
      </div>

      {/* Create/Edit Modal */}
      <CompetitionClassFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        competitionClass={selectedClass}
        cabors={cabors}
        onSuccess={handleSaveSuccess}
      />

      {/* Delete Modal */}
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
                    disabled={deleteMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
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
