import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  User,
  Loader2,
  AlertCircle,
  Filter,
  Eye,
  Layers,
  Download,
  Upload,
  CheckCircle2,
  X
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { CoachFormModal } from '../components/CoachFormModal';
import { CoachDetailModal } from '../components/CoachDetailModal';
import { ProtectedImage } from '../components/ProtectedImage';
import { useCoaches, useDeleteCoach, coachKeys } from '../hooks/queries/useCoaches';
import { useCaborsAll } from '../hooks/queries/useCabors';
import { useCoachClustersAll, useCoachSubClustersByCluster } from '../hooks/queries/useCoachClusterMaster';
import api from '../api/axios';

export function CoachesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCabor, setFilterCabor] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [filterCluster, setFilterCluster] = useState('');
  const [filterSubCluster, setFilterSubCluster] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [coachToDelete, setCoachToDelete] = useState(null);

  // Export / Import / UI state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Refs & Query Client
  const importFileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // TanStack Query hooks
  const { data: cabors = [] } = useCaborsAll();
  const { data: clusters = [] } = useCoachClustersAll();
  const { data: subClusters = [] } = useCoachSubClustersByCluster(filterCluster);
  const {
    data: coachesData,
    isLoading: loading,
    refetch: refetchCoaches
  } = useCoaches({
    page,
    search: debouncedSearch,
    caborId: filterCabor,
    isActive: filterActive,
    clusterId: filterCluster,
    subClusterId: filterSubCluster
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
  }, [filterCabor, filterActive, filterCluster, filterSubCluster]);

  useEffect(() => {
    if (filterSubCluster && !subClusters.some((item) => String(item.id) === String(filterSubCluster))) {
      setFilterSubCluster('');
    }
  }, [filterSubCluster, subClusters]);

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

  const handleDownloadImportTemplate = async () => {
    setIsExporting(true);
    try {
      const response = await api.get('/api/coaches/import/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_import_pelatih_koni.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download import template failed:', error);
      alert('Gagal mengunduh template import. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    importFileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      alert('File import harus berformat .xlsx');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/coaches/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(response.data);
      setSuccessMessage('Import data pelatih selesai.');
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries({ queryKey: coachKeys.all });
    } catch (error) {
      console.error('Import coaches failed:', error);
      alert(error.response?.data?.message || 'Gagal mengimport data pelatih. Silakan coba lagi.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <DashboardLayout title="Data Pelatih" subtitle="Kelola data pelatih dan informasi lengkapnya">
      {/* Success Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 bg-green-600 text-white rounded-xl shadow-lg shadow-green-600/30"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage('')}
              className="ml-2 p-0.5 hover:bg-green-500 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                <option key={cabor.id} value={cabor.id}>{cabor.display_name || cabor.name}</option>
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

          <select
            value={filterCluster}
            onChange={(e) => setFilterCluster(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none appearance-none cursor-pointer"
          >
            <option value="">Semua Cluster</option>
            {clusters.map((cluster) => <option key={cluster.id} value={cluster.id}>{cluster.name}</option>)}
          </select>

          {filterCluster && subClusters.length > 0 && (
            <select
              value={filterSubCluster}
              onChange={(e) => setFilterSubCluster(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none appearance-none cursor-pointer"
            >
              <option value="">Semua Sub-Kluster</option>
              {subClusters.map((subCluster) => <option key={subCluster.id} value={subCluster.id}>{subCluster.name}</option>)}
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <input
            ref={importFileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleDownloadImportTemplate}
            disabled={isExporting || isImporting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-700 rounded-xl font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
            title="Download template Excel untuk import data pelatih"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span>Template Excel</span>
          </button>

          <button
            type="button"
            onClick={handleImportClick}
            disabled={isImporting || isExporting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            title="Import data pelatih dari file Excel .xlsx"
          >
            {isImporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span>Import Excel</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pelatih</span>
          </button>
        </div>
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
                  <th className="text-left py-4 px-4 font-semibold text-slate-600">Kluster</th>
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
                      <span className="text-slate-600">{coach.cabor?.display_name || coach.cabor?.name || '-'}</span>
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
                      <div className="flex items-center gap-2 text-slate-600">
                        <Layers className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium">{coach.current_cluster_label || 'Pelatih Non Binaan'}</p>
                          {coach.current_sub_cluster_label && <p className="text-xs text-slate-400">{coach.current_sub_cluster_label}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-600">{coach.phone || '-'}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${coach.is_active
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

      <CoachDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        coach={selectedCoach}
      />

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

      {/* Import Result Modal */}
      <AnimatePresence>
        {importResult && (
          <>
            <motion.div
              key="import-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setImportResult(null)}
            />
            <motion.div
              key="import-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Hasil Import Data Pelatih
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {importResult.message || "Import selesai"}
                    </p>
                  </div>
                  <button
                    onClick={() => setImportResult(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500">Total Diproses</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {importResult.total_rows || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-xs text-green-700">Berhasil</p>
                    <p className="text-2xl font-bold text-green-700">
                      {importResult.success_count || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-xs text-red-700">Gagal</p>
                    <p className="text-2xl font-bold text-red-700">
                      {importResult.failed_count || 0}
                    </p>
                  </div>
                </div>

                {importResult.errors?.length > 0 ? (
                  <div className="max-h-72 overflow-y-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600 w-24">
                            Baris
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importResult.errors.map((error, index) => (
                          <tr key={`${error.row}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {error.row}
                            </td>
                            <td className="px-4 py-3 text-red-600">
                              {error.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm">
                    Tidak ada error pada file import.
                  </div>
                )}

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => setImportResult(null)}
                    className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                  >
                    Tutup
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
