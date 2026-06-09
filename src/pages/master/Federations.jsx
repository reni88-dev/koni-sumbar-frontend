import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Shield, X, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { useFederations, useCreateFederation, useUpdateFederation, useDeleteFederation } from '../../hooks/queries/useFederations';

const emptyForm = { code: '', name: '', display_name: '', slug: '', level: 'provincial', website: '', is_active: true };

const levelLabels = {
  national: 'Nasional',
  provincial: 'Provinsi',
  international: 'Internasional',
  other: 'Lainnya',
};

export function FederationsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedFederation, setSelectedFederation] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [federationToDelete, setFederationToDelete] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [deleteError, setDeleteError] = useState(null);

  const { data: federationsData, isLoading: loading } = useFederations({ page, search: debouncedSearch, perPage: 10 });
  const createMutation = useCreateFederation();
  const updateMutation = useUpdateFederation();
  const deleteMutation = useDeleteFederation();

  const federations = federationsData?.data || [];
  const pagination = {
    current_page: federationsData?.current_page || 1,
    last_page: federationsData?.last_page || 1,
    total: federationsData?.total || 0,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedFederation(null);
    setFormData(emptyForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (federation) => {
    setModalMode('edit');
    setSelectedFederation(federation);
    setFormData({
      code: federation.code || '',
      name: federation.name || '',
      display_name: federation.display_name || '',
      slug: federation.slug || '',
      level: federation.level || 'provincial',
      website: federation.website || '',
      is_active: federation.is_active,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = ['Nama wajib diisi'];
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (modalMode === 'create') await createMutation.mutateAsync(formData);
      else await updateMutation.mutateAsync({ id: selectedFederation.id, data: formData });
      setIsModalOpen(false);
    } catch (error) {
      setFormErrors({ submit: [error.response?.data?.error || error.response?.data?.message || 'Gagal menyimpan federasi'] });
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(federationToDelete.id);
      setIsDeleteModalOpen(false);
      setFederationToDelete(null);
    } catch (error) {
      setDeleteError(error.response?.data?.error || error.response?.data?.message || 'Gagal menghapus federasi');
    }
  };

  const formLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout title="Master Federasi" subtitle="Kelola data federasi cabang olahraga">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative max-w-md flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
          <input type="text" placeholder="Cari federasi..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" />
        </div>
        <button onClick={openCreateModal} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">
          <Plus className="w-5 h-5" />
          <span>Tambah Federasi</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kode</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Display Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Level</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Website</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" /></td></tr>
              ) : federations.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Tidak ada data federasi</td></tr>
              ) : federations.map((federation) => (
                <tr key={federation.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">{federation.code || '-'}</span></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center"><Shield className="w-4 h-4 text-red-600" /></div><span className="font-semibold text-slate-800">{federation.name}</span></div></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{federation.display_name || '-'}</td>
                  <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">{levelLabels[federation.level] || federation.level}</span></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{federation.website ? <a href={federation.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"><span>Website</span><ExternalLink className="w-3 h-3" /></a> : '-'}</td>
                  <td className="px-6 py-4 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${federation.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{federation.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td className="px-6 py-4"><div className="flex items-center justify-end gap-2"><button onClick={() => openEditModal(federation)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button><button onClick={() => { setFederationToDelete(federation); setIsDeleteModalOpen(true); }} className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.last_page > 1 && <div className="flex items-center justify-center gap-2 mt-6">{Array.from({ length: pagination.last_page }, (_, i) => <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-xl font-medium transition-colors ${pagination.current_page === i + 1 ? 'bg-red-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>{i + 1}</button>)}</div>}

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">{modalMode === 'create' ? 'Tambah Federasi' : 'Edit Federasi'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  {formErrors.submit && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{formErrors.submit[0]}</div>}
                  <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">Kode</label><input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" placeholder="PSSI" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Level</label><select value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"><option value="provincial">Provinsi</option><option value="national">Nasional</option><option value="international">Internasional</option><option value="other">Lainnya</option></select></div></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" required />{formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name[0]}</p>}</div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label><input type="text" value={formData.display_name} onChange={e => setFormData({ ...formData, display_name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" placeholder="PSSI Sumbar" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Slug</label><input type="text" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Website</label><input type="url" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" placeholder="https://..." /></div>
                  <div className="flex items-center gap-3"><input type="checkbox" id="federation_active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 accent-red-600" /><label htmlFor="federation_active" className="text-sm text-slate-700">Aktif</label></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">Batal</button><button type="submit" disabled={formLoading} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{formLoading && <Loader2 className="w-4 h-4 animate-spin" />}{modalMode === 'create' ? 'Simpan' : 'Update'}</button></div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={() => { setIsDeleteModalOpen(false); setDeleteError(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-red-600" /></div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Federasi?</h3>
                <p className="text-slate-500 text-sm mb-4">Anda yakin ingin menghapus <strong>{federationToDelete?.display_name || federationToDelete?.name}</strong>?</p>
                {deleteError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-left">{deleteError}</div>}
                <div className="flex gap-3"><button onClick={() => { setIsDeleteModalOpen(false); setDeleteError(null); }} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">Batal</button><button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">{deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}</button></div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
