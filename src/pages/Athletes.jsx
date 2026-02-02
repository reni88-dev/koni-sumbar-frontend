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
  Eye,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { AthleteFormModal } from '../components/AthleteFormModal';
import { AthleteDetailModal } from '../components/AthleteDetailModal';
import { ProtectedImage } from '../components/ProtectedImage';
import { useAthletes, useDeleteAthlete } from '../hooks/queries/useAthletes';
import { useCaborsAll } from '../hooks/queries/useCabors';
import api from '../api/axios';

export function AthletesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCabor, setFilterCabor] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [page, setPage] = useState(1);
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState(null);

  // Export states
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const genderLabels = { male: 'Laki-laki', female: 'Perempuan' };

  // TanStack Query hooks
  const { data: cabors = [] } = useCaborsAll();
  const { 
    data: athletesData, 
    isLoading: loading,
    refetch: refetchAthletes 
  } = useAthletes({ 
    page, 
    search: debouncedSearch, 
    caborId: filterCabor, 
    gender: filterGender 
  });
  
  const deleteAthleteMutation = useDeleteAthlete();

  const athletes = athletesData?.data || [];
  const pagination = {
    current_page: athletesData?.current_page || 1,
    last_page: athletesData?.last_page || 1,
    total: athletesData?.total || 0
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
  }, [filterCabor, filterGender]);

  const openCreateModal = () => {
    setSelectedAthlete(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (athlete) => {
    setSelectedAthlete(athlete);
    setIsFormModalOpen(true);
  };

  const openDetailModal = (athlete) => {
    setSelectedAthlete(athlete);
    setIsDetailModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    refetchAthletes();
  };

  const handleDelete = async () => {
    try {
      await deleteAthleteMutation.mutateAsync(athleteToDelete.id);
      setIsDeleteModalOpen(false);
      setAthleteToDelete(null);
    } catch (error) {
      console.error('Failed to delete athlete:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleExport = async (type) => {
    setIsExporting(true);
    setIsExportMenuOpen(false);
    
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (filterCabor) params.append('cabor_id', filterCabor);
      if (filterGender) params.append('gender', filterGender);
      
      const response = await api.get(`/api/athletes/export/${type}?${params.toString()}`, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `data_atlet_koni_${new Date().toISOString().split('T')[0]}.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Gagal mengekspor data. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout title="Data Atlet" subtitle="Kelola data atlet dan informasi lengkapnya">
      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama atau NIK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none w-64"
            />
          </div>
          <select
            value={filterCabor}
            onChange={(e) => setFilterCabor(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
          >
            <option value="">Semua Cabor</option>
            {cabors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
          >
            <option value="">Semua Gender</option>
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              {isExporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span>Export</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {isExportMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsExportMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-20">
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium">PDF (.pdf)</span>
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Add Athlete Button */}
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Atlet</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 p-4 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
        <span className="text-sm text-slate-600">Total: <strong className="text-slate-800">{pagination.total}</strong> atlet</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Atlet</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">NIK</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cabor</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">TTL</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
                  </td>
                </tr>
              ) : athletes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data atlet
                  </td>
                </tr>
              ) : (
                athletes.map((athlete) => (
                  <tr key={athlete.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {athlete.photo ? (
                          <ProtectedImage 
                            src={`/storage/${athlete.photo}`}
                            alt={athlete.name}
                            className="w-10 h-10 rounded-full object-cover"
                            fallback={
                              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-medium">
                                {athlete.name?.charAt(0) || '?'}
                              </div>
                            }
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-medium">
                            {athlete.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <span className="font-medium text-slate-800">{athlete.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-600">{athlete.nik || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                        {athlete.cabor?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {athlete.birth_place ? `${athlete.birth_place}, ` : ''}{formatDate(athlete.birth_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        athlete.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                      }`}>
                        {genderLabels[athlete.gender] || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        athlete.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {athlete.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailModal(athlete)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(athlete)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setAthleteToDelete(athlete); setIsDeleteModalOpen(true); }}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                          title="Hapus"
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
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: Math.min(pagination.last_page, 10) }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                pagination.current_page === i + 1
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AthleteFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        athlete={selectedAthlete}
        onSuccess={handleFormSuccess}
      />

      {/* Detail Modal */}
      <AthleteDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        athlete={selectedAthlete}
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
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Atlet?</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Anda yakin ingin menghapus atlet <strong>{athleteToDelete?.name}</strong>?
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
                    disabled={deleteAthleteMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteAthleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
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
