import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Trophy, X, Loader2, AlertCircle, Users, Upload, Network } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ProtectedImage } from '../../components/ProtectedImage';
import { useCabors, useCaborSports, useCreateCabor, useUpdateCabor, useDeleteCabor } from '../../hooks/queries/useCabors';
import { useFederationsAll } from '../../hooks/queries/useFederations';

const emptyForm = { level: 'sport', parent_id: '', name: '', slug: '', code: '', description: '', federation_id: '', federation: '', sort_order: 0, is_active: true };

export function CaborsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedCabor, setSelectedCabor] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [caborToDelete, setCaborToDelete] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [deleteError, setDeleteError] = useState(null);

  const { data: caborsData, isLoading: loading } = useCabors({ search: debouncedSearch, perPage: 100, tree: filterLevel === '', level: filterLevel });
  const { data: sports = [] } = useCaborSports();
  const { data: federations = [] } = useFederationsAll();
  const createCaborMutation = useCreateCabor();
  const updateCaborMutation = useUpdateCabor();
  const deleteCaborMutation = useDeleteCabor();

  const cabors = caborsData?.data || [];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const rows = filterLevel === ''
    ? cabors.flatMap((cabor) => {
        if (cabor.level === 'sport') {
          return [
            { ...cabor, rowType: 'sport', depth: 0 },
            ...(cabor.children || []).map((child) => ({ ...child, rowType: 'discipline', depth: 1 })),
          ];
        }
        return [{ ...cabor, rowType: 'orphan-discipline', depth: 0 }];
      })
    : cabors.map((cabor) => ({ ...cabor, rowType: cabor.level || 'discipline', depth: 0 }));

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(600 / img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', { type: 'image/webp', lastModified: Date.now() });
        setLogoFile(compressed);
        setLogoPreview(URL.createObjectURL(compressed));
      }, 'image/webp', 0.85);
    };
    img.src = URL.createObjectURL(file);
  };

  const openCreateModal = (level = 'sport', parent = null) => {
    setModalMode('create');
    setSelectedCabor(null);
    setFormData({ ...emptyForm, level, parent_id: parent?.id || '', federation_id: parent?.federation_id || '', federation: parent?.federation || '' });
    setLogoFile(null);
    setLogoPreview(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (cabor) => {
    setModalMode('edit');
    setSelectedCabor(cabor);
    setFormData({
      level: cabor.level || 'discipline',
      parent_id: cabor.parent_id || '',
      name: cabor.name || '',
      slug: cabor.slug || '',
      code: cabor.code || '',
      description: cabor.description || '',
      federation_id: cabor.federation_id || '',
      federation: cabor.federation || '',
      sort_order: cabor.sort_order || 0,
      is_active: cabor.is_active,
    });
    setLogoFile(null);
    setLogoPreview(cabor.logo ? `/api/storage/${cabor.logo}` : null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = ['Nama wajib diisi'];
    if (formData.level === 'discipline' && !formData.parent_id) errors.parent_id = ['Cabor induk wajib dipilih'];
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'federation' && formData.federation_id) return;
        if (key === 'is_active') data.append(key, value ? '1' : '0');
        else if (value !== null && value !== undefined) data.append(key, value);
      });
      if (formData.level === 'sport') data.set('parent_id', '');
      if (logoFile) data.append('logo', logoFile);
      if (modalMode === 'create') await createCaborMutation.mutateAsync(data);
      else await updateCaborMutation.mutateAsync({ id: selectedCabor.id, formData: data });
      setIsModalOpen(false);
    } catch (error) {
      setFormErrors({ submit: [error.response?.data?.error || error.response?.data?.message || 'Gagal menyimpan cabor'] });
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteCaborMutation.mutateAsync(caborToDelete.id);
      setIsDeleteModalOpen(false);
      setCaborToDelete(null);
    } catch (error) {
      setDeleteError(error.response?.data?.error || error.response?.data?.message || 'Gagal menghapus cabor');
    }
  };

  const formLoading = createCaborMutation.isPending || updateCaborMutation.isPending;

  return (
    <DashboardLayout title="Master Cabang Olahraga" subtitle="Kelola cabor induk dan disiplin cabor">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative max-w-md flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            <input type="text" placeholder="Cari cabor atau disiplin..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" />
          </div>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none">
            <option value="">Semua dalam Tree</option>
            <option value="sport">Cabor Induk</option>
            <option value="discipline">Disiplin</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openCreateModal('sport')} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
            <Network className="w-5 h-5" />
            <span>Cabor Induk</span>
          </button>
          <button onClick={() => openCreateModal('discipline')} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">
            <Plus className="w-5 h-5" />
            <span>Disiplin</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cabor / Disiplin</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Induk</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Federasi</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Atlet</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Tidak ada data cabor</td></tr>
              ) : rows.map((cabor) => (
                <tr key={cabor.id} className={`${cabor.rowType === 'sport' ? 'bg-slate-50/80 border-t-2 border-slate-200' : cabor.rowType === 'orphan-discipline' ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-slate-50'} transition-colors`}>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-3 ${cabor.depth === 1 ? 'pl-8' : ''}`}>
                      {cabor.logo ? <ProtectedImage src={`/api/storage/${cabor.logo}`} alt={cabor.name} className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white" fallback={<Trophy className="w-5 h-5 text-slate-300" />} /> : <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center"><Trophy className="w-5 h-5 text-slate-300" /></div>}
                      <div>
                        <div className={`font-medium ${cabor.level === 'sport' ? 'text-slate-900' : 'text-slate-700'}`}>{cabor.name}</div>
                        <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${cabor.level === 'sport' ? 'bg-indigo-100 text-indigo-700' : cabor.rowType === 'orphan-discipline' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>{cabor.level === 'sport' ? 'Cabor Induk' : cabor.rowType === 'orphan-discipline' ? 'Disiplin tanpa induk' : 'Disiplin'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{cabor.rowType === 'orphan-discipline' ? 'Belum ada induk' : cabor.parent_name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{cabor.federation_display_name || cabor.federation_name || cabor.federation || '-'}</td>
                  <td className="px-6 py-4 text-center"><span className="inline-flex items-center gap-1 text-sm text-slate-600"><Users className="w-4 h-4" />{cabor.athletes_count || 0}</span></td>
                  <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${cabor.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{cabor.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td className="px-6 py-4"><div className="flex items-center justify-end gap-2">
                    {cabor.level === 'sport' && <button onClick={() => openCreateModal('discipline', cabor)} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100">+ Disiplin</button>}
                    <button onClick={() => openEditModal(cabor)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { setCaborToDelete(cabor); setIsDeleteModalOpen(true); }} className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">{modalMode === 'create' ? 'Tambah Cabor' : 'Edit Cabor'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  {formErrors.submit && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{formErrors.submit[0]}</div>}
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setFormData(f => ({ ...f, level: 'sport', parent_id: '' }))} className={`px-4 py-2.5 rounded-xl border font-medium ${formData.level === 'sport' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200'}`}>Cabor Induk</button>
                    <button type="button" onClick={() => setFormData(f => ({ ...f, level: 'discipline' }))} className={`px-4 py-2.5 rounded-xl border font-medium ${formData.level === 'discipline' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200'}`}>Disiplin</button>
                  </div>
                  {formData.level === 'discipline' && <div><label className="block text-sm font-medium text-slate-700 mb-1">Cabor Induk</label><select value={formData.parent_id} onChange={e => setFormData({ ...formData, parent_id: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"><option value="">Pilih Cabor Induk</option>{sports.map(s => <option key={s.id} value={s.id}>{s.raw_name || s.name}</option>)}</select>{formErrors.parent_id && <p className="text-red-500 text-xs mt-1">{formErrors.parent_id[0]}</p>}</div>}
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" required />{formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name[0]}</p>}</div>
                  <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">Slug</label><input type="text" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Kode</label><input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" /></div></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Federasi</label><select value={formData.federation_id} onChange={e => setFormData({ ...formData, federation_id: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"><option value="">Pilih Federasi</option>{federations.map(f => <option key={f.id} value={f.id}>{f.display_name || f.name}</option>)}</select>{!formData.federation_id && formData.federation && <p className="text-xs text-slate-500 mt-1">Legacy: {formData.federation}</p>}</div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label><textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none" rows={3} /></div>
                  <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label><input type="number" value={formData.sort_order} onChange={e => setFormData({ ...formData, sort_order: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" /></div><div className="flex items-end pb-3 gap-3"><input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 accent-red-600" /><label htmlFor="is_active" className="text-sm text-slate-700">Aktif</label></div></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-2">Logo</label><div className="flex items-center gap-4"><div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">{logoPreview ? (logoPreview.startsWith('/api/') ? <ProtectedImage src={logoPreview} alt="Preview" className="w-full h-full object-contain" fallback={<Trophy className="w-8 h-8 text-slate-400" />} /> : <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />) : <Trophy className="w-8 h-8 text-slate-400" />}</div><label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"><Upload className="w-4 h-4" /><span className="text-sm font-medium">Upload Logo</span><input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" /></label></div></div>
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
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Cabor?</h3>
                <p className="text-slate-500 text-sm mb-4">Anda yakin ingin menghapus <strong>{caborToDelete?.name}</strong>?</p>
                {deleteError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-left">{deleteError}</div>}
                <div className="flex gap-3"><button onClick={() => { setIsDeleteModalOpen(false); setDeleteError(null); }} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">Batal</button><button onClick={handleDelete} disabled={deleteCaborMutation.isPending} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">{deleteCaborMutation.isPending ? 'Menghapus...' : 'Hapus'}</button></div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
