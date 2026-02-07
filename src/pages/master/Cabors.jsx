import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Trophy,
  X,
  Loader2,
  AlertCircle,
  Users,
  Upload
} from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ProtectedImage } from '../../components/ProtectedImage';
import { useCabors, useCreateCabor, useUpdateCabor, useDeleteCabor } from '../../hooks/queries/useCabors';

export function CaborsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedCabor, setSelectedCabor] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [caborToDelete, setCaborToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', description: '', federation: '', is_active: true });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [deleteError, setDeleteError] = useState(null);

  // TanStack Query hooks
  const { data: caborsData, isLoading: loading } = useCabors({ page, search: debouncedSearch, perPage: 12 });
  const createCaborMutation = useCreateCabor();
  const updateCaborMutation = useUpdateCabor();
  const deleteCaborMutation = useDeleteCabor();

  const cabors = caborsData?.data || [];
  const pagination = {
    current_page: caborsData?.current_page || 1,
    last_page: caborsData?.last_page || 1,
    total: caborsData?.total || 0
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ name: '', description: '', federation: '', is_active: true });
    setLogoFile(null);
    setLogoPreview(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (cabor) => {
    setModalMode('edit');
    setSelectedCabor(cabor);
    setFormData({ 
      name: cabor.name, 
      description: cabor.description || '', 
      federation: cabor.federation || '',
      is_active: cabor.is_active
    });
    setLogoFile(null);
    setLogoPreview(cabor.logo ? `/api/storage/${cabor.logo}` : null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('federation', formData.federation);
      data.append('is_active', formData.is_active ? '1' : '0');
      if (logoFile) {
        data.append('logo', logoFile);
      }

      if (modalMode === 'create') {
        await createCaborMutation.mutateAsync(data);
      } else {
        await updateCaborMutation.mutateAsync({ id: selectedCabor.id, formData: data });
      }
      setIsModalOpen(false);
    } catch (error) {
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors || {});
      }
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteCaborMutation.mutateAsync(caborToDelete.id);
      setIsDeleteModalOpen(false);
      setCaborToDelete(null);
    } catch (error) {
      console.error('Failed to delete cabor:', error);
      setDeleteError(error.response?.data?.error || error.response?.data?.message || 'Gagal menghapus cabor');
    }
  };

  const formLoading = createCaborMutation.isPending || updateCaborMutation.isPending;

  return (
    <DashboardLayout title="Master Cabang Olahraga" subtitle="Kelola data cabang olahraga">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari cabor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
          />
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Cabor</span>
        </button>
      </div>

      {/* Cabors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
          </div>
        ) : cabors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            Tidak ada data cabor
          </div>
        ) : (
          cabors.map((cabor) => (
            <motion.div
              key={cabor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                {cabor.logo ? (
                  <ProtectedImage 
                    src={`/api/storage/${cabor.logo}`}
                    alt={cabor.name}
                    className="h-20 w-20 object-contain"
                    fallback={<Trophy className="w-12 h-12 text-slate-300" />}
                  />
                ) : (
                  <Trophy className="w-12 h-12 text-slate-300" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-800">{cabor.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    cabor.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {cabor.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{cabor.federation || '-'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Users className="w-4 h-4" />
                    <span>{cabor.athletes_count || 0} Atlet</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(cabor)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setCaborToDelete(cabor); setIsDeleteModalOpen(true); }}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: pagination.last_page }, (_, i) => (
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

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">
                    {modalMode === 'create' ? 'Tambah Cabor Baru' : 'Edit Cabor'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">
                        {logoPreview ? (
                          logoPreview.startsWith('/api/') ? (
                            <ProtectedImage 
                              src={logoPreview} 
                              alt="Preview" 
                              className="w-full h-full object-contain"
                              fallback={<Trophy className="w-8 h-8 text-slate-400" />}
                            />
                          ) : (
                            <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
                          )
                        ) : (
                          <Trophy className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm font-medium">Upload Logo</span>
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Cabor</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="Contoh: Sepak Bola"
                      required
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name[0]}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Induk Organisasi</label>
                    <input
                      type="text"
                      value={formData.federation}
                      onChange={e => setFormData({...formData, federation: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="Contoh: PSSI"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
                      rows={3}
                      placeholder="Deskripsi cabang olahraga..."
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 accent-red-600"
                    />
                    <label htmlFor="is_active" className="text-sm text-slate-700">Aktif</label>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {modalMode === 'create' ? 'Simpan' : 'Update'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => { setIsDeleteModalOpen(false); setDeleteError(null); }}
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
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Cabor?</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Anda yakin ingin menghapus cabor <strong>{caborToDelete?.name}</strong>?
                </p>
                {deleteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 text-left">{deleteError}</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setIsDeleteModalOpen(false); setDeleteError(null); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteCaborMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteCaborMutation.isPending ? 'Menghapus...' : 'Hapus'}
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
