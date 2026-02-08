import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  User,
  X,
  Loader2,
  AlertCircle,
  Filter,
  Eye
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { CoachFormModal } from '../components/CoachFormModal';
import { ProtectedImage } from '../components/ProtectedImage';
import { useCoaches, useDeleteCoach } from '../hooks/queries/useCoaches';
import { useCaborsAll } from '../hooks/queries/useCabors';
import api from '../api/axios';

export function CoachesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCabor, setFilterCabor] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [page, setPage] = useState(1);
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [coachToDelete, setCoachToDelete] = useState(null);

  const genderLabels = { male: 'Laki-laki', female: 'Perempuan' };

  // TanStack Query hooks
  const { data: cabors = [] } = useCaborsAll();
  const { 
    data: coachesData, 
    isLoading: loading,
    refetch: refetchCoaches 
  } = useCoaches({ 
    page, 
    search: debouncedSearch, 
    caborId: filterCabor, 
    isActive: filterActive
  });
  
  const deleteCoachMutation = useDeleteCoach();

  const coaches = coachesData?.data || [];
  const pagination = {
    current_page: coachesData?.page || 1,
    last_page: Math.ceil((coachesData?.total || 0) / (coachesData?.per_page || 10)),
    total: coachesData?.total || 0
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterCabor, filterActive]);

  const openCreateModal = () => {
    setSelectedCoach(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = async (coach) => {
    try {
      const response = await api.get(`/api/coaches/${coach.id}`);
      setSelectedCoach(response.data);
      setIsFormModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch coach details:', error);
      setSelectedCoach(coach);
      setIsFormModalOpen(true);
    }
  };

  const openDetailModal = async (coach) => {
    try {
      const response = await api.get(`/api/coaches/${coach.id}`);
      setSelectedCoach(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch coach details:', error);
      setSelectedCoach(coach);
      setIsDetailModalOpen(true);
    }
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    refetchCoaches();
  };

  const handleDelete = async () => {
    try {
      await deleteCoachMutation.mutateAsync(coachToDelete.id);
      setIsDeleteModalOpen(false);
      setCoachToDelete(null);
    } catch (error) {
      console.error('Failed to delete coach:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <DashboardLayout title="Data Pelatih" subtitle="Kelola data pelatih dan informasi lengkapnya">
      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pelatih..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none w-64"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterCabor}
              onChange={(e) => setFilterCabor(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none appearance-none cursor-pointer"
            >
              <option value="">Semua Cabor</option>
              {cabors.map((cabor) => (
                <option key={cabor.id} value={cabor.id}>{cabor.name}</option>
              ))}
            </select>
          </div>

          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none appearance-none cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Tidak Aktif</option>
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelatih</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
        ) : coaches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <User className="w-12 h-12 mb-2" />
            <p>Belum ada data pelatih</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-600">Pelatih</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-600">Cabor</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-600">Lisensi</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-600">Telepon</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-600">Status</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coaches.map((coach) => (
                  <tr key={coach.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                          {coach.photo ? (
                            <ProtectedImage
                              src={`/api/coaches/${coach.id}/photo?t=${coach.updated_at}`}
                              alt={coach.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{coach.name}</p>
                          <p className="text-sm text-slate-500">{coach.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-600">{coach.cabor?.name || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-slate-600">{coach.license_number || '-'}</p>
                        {coach.license_level && (
                          <p className="text-xs text-slate-400">{coach.license_level}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-600">{coach.phone || '-'}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        coach.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {coach.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openDetailModal(coach)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          onClick={() => openEditModal(coach)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => {
                            setCoachToDelete(coach);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
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

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Menampilkan {coaches.length} dari {pagination.total} pelatih
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                disabled={page === pagination.last_page}
                className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <CoachFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        coach={selectedCoach}
        onSuccess={handleFormSuccess}
      />

      {/* Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedCoach && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsDetailModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Detail Pelatih</h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Photo & Name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                    {selectedCoach.photo ? (
                      <ProtectedImage
                        src={`/api/coaches/${selectedCoach.id}/photo?t=${selectedCoach.updated_at}`}
                        alt={selectedCoach.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-10 h-10 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{selectedCoach.name}</h3>
                    <p className="text-slate-500">{selectedCoach.cabor?.name || '-'}</p>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${
                      selectedCoach.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedCoach.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase">NIK</p>
                    <p className="text-slate-700">{selectedCoach.nik || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Jenis Kelamin</p>
                    <p className="text-slate-700">{genderLabels[selectedCoach.gender] || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Tempat Lahir</p>
                    <p className="text-slate-700">{selectedCoach.birth_place || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Tanggal Lahir</p>
                    <p className="text-slate-700">{formatDate(selectedCoach.birth_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Agama</p>
                    <p className="text-slate-700">{selectedCoach.religion || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">No. Telepon</p>
                    <p className="text-slate-700">{selectedCoach.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Email</p>
                    <p className="text-slate-700">{selectedCoach.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Nomor Lisensi</p>
                    <p className="text-slate-700">{selectedCoach.license_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Level Lisensi</p>
                    <p className="text-slate-700">{selectedCoach.license_level || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Tahun Mulai Melatih</p>
                    <p className="text-slate-700">{selectedCoach.coaching_start_year || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Spesialisasi</p>
                    <p className="text-slate-700">{selectedCoach.specialization || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 uppercase">Alamat</p>
                    <p className="text-slate-700">{selectedCoach.address || '-'}</p>
                  </div>
                  {selectedCoach.achievements && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400 uppercase">Prestasi</p>
                      <p className="text-slate-700 whitespace-pre-wrap">{selectedCoach.achievements}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && coachToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Hapus Pelatih</h3>
                  <p className="text-slate-500 text-sm">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <p className="text-slate-600 mb-6">
                Apakah Anda yakin ingin menghapus pelatih <strong>{coachToDelete.name}</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteCoachMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleteCoachMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
