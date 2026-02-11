import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit2, Trash2, Building2, X, Loader2, AlertCircle,
  MapPin, Link2, Unlink
} from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { 
  useOrganizations, useCreateOrganization, useUpdateOrganization, useDeleteOrganization,
  useLinkCabor, useUnlinkCabor
} from '../../hooks/queries/useOrganizations';
import { useRegionsAll } from '../../hooks/queries/useRegions';
import { useOrganizationsAll } from '../../hooks/queries/useOrganizations';
import { useCaborsAll } from '../../hooks/queries/useCabors';

const ORG_TYPES = [
  { value: '', label: 'Semua Tipe' },
  { value: 'koni', label: 'KONI' },
  { value: 'pengprov', label: 'Pengprov' },
  { value: 'pengkot', label: 'Pengkot' },
  { value: 'pengkab', label: 'Pengkab' },
  { value: 'komcab', label: 'Komcab' },
];

const TYPE_COLORS = {
  koni: 'bg-red-100 text-red-700',
  pengprov: 'bg-blue-100 text-blue-700',
  pengkot: 'bg-purple-100 text-purple-700',
  pengkab: 'bg-amber-100 text-amber-700',
  komcab: 'bg-green-100 text-green-700',
};

export function OrganizationsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [isCaborModalOpen, setIsCaborModalOpen] = useState(false);
  const [caborOrg, setCaborOrg] = useState(null);
  const [selectedCaborId, setSelectedCaborId] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '', type: 'pengprov', parent_id: null, region_id: null,
    address: '', phone: '', email: '', website: '',
    chairman_name: '', secretary_name: '', is_active: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [deleteError, setDeleteError] = useState(null);

  // TanStack Query hooks
  const { data: orgsData, isLoading: loading } = useOrganizations({ page, search: debouncedSearch, perPage: 15, type: typeFilter });
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();
  const deleteMutation = useDeleteOrganization();
  const linkCaborMutation = useLinkCabor();
  const unlinkCaborMutation = useUnlinkCabor();

  // Dropdown data
  const { data: allRegions = [] } = useRegionsAll();
  const { data: parentOrgs = [] } = useOrganizationsAll();
  const { data: allCabors = [] } = useCaborsAll();

  const organizations = orgsData?.data || [];
  const pagination = {
    current_page: orgsData?.page || 1,
    last_page: Math.ceil((orgsData?.total || 0) / 15) || 1,
    total: orgsData?.total || 0
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      name: '', type: 'pengprov', parent_id: null, region_id: null,
      address: '', phone: '', email: '', website: '',
      chairman_name: '', secretary_name: '', is_active: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (org) => {
    setModalMode('edit');
    setSelectedOrg(org);
    setFormData({
      name: org.name, type: org.type,
      parent_id: org.parent_id || null,
      region_id: org.region_id || null,
      address: org.address || '', phone: org.phone || '',
      email: org.email || '', website: org.website || '',
      chairman_name: org.chairman_name || '', secretary_name: org.secretary_name || '',
      is_active: org.is_active
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(formData);
      } else {
        await updateMutation.mutateAsync({ id: selectedOrg.id, data: formData });
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
      await deleteMutation.mutateAsync(orgToDelete.id);
      setIsDeleteModalOpen(false);
      setOrgToDelete(null);
    } catch (error) {
      setDeleteError(error.response?.data?.error || 'Gagal menghapus organisasi');
    }
  };

  const handleLinkCabor = async () => {
    if (!selectedCaborId || !caborOrg) return;
    try {
      await linkCaborMutation.mutateAsync({ orgId: caborOrg.id, caborId: parseInt(selectedCaborId) });
      setSelectedCaborId('');
    } catch (error) {
      console.error('Failed to link cabor:', error);
    }
  };

  const handleUnlinkCabor = async (caborId) => {
    if (!caborOrg) return;
    try {
      await unlinkCaborMutation.mutateAsync({ orgId: caborOrg.id, caborId });
    } catch (error) {
      console.error('Failed to unlink cabor:', error);
    }
  };

  const formLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout title="Master Organisasi" subtitle="Kelola hirarki organisasi KONI">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari organisasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
          >
            {ORG_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Organisasi</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Organisasi</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipe</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Induk</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Wilayah</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ketua</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cabor</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Tidak ada data organisasi
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <motion.tr
                    key={org.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800 block">{org.name}</span>
                          {org.email && <span className="text-xs text-slate-400">{org.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[org.type] || 'bg-slate-100 text-slate-500'}`}>
                        {org.type?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{org.parent?.name || '-'}</td>
                    <td className="px-6 py-4">
                      {org.region ? (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <MapPin className="w-3 h-3" />
                          {org.region.name}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{org.chairman_name || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {org.cabors?.slice(0, 3).map(c => (
                          <span key={c.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{c.name}</span>
                        ))}
                        {(org.cabors?.length || 0) > 3 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">+{org.cabors.length - 3}</span>
                        )}
                        {(!org.cabors || org.cabors.length === 0) && <span className="text-xs text-slate-400">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        org.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {org.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setCaborOrg(org); setIsCaborModalOpen(true); }}
                          className="p-2 hover:bg-blue-50 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                          title="Kelola Cabor"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(org)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setOrgToDelete(org); setIsDeleteModalOpen(true); }}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                  <h2 className="text-lg font-bold text-slate-800">
                    {modalMode === 'create' ? 'Tambah Organisasi Baru' : 'Edit Organisasi'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nama Organisasi</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                        placeholder="Contoh: Pengprov PBSI Sumbar"
                        required
                      />
                      {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name[0]}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tipe</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      >
                        <option value="koni">KONI</option>
                        <option value="pengprov">Pengprov</option>
                        <option value="pengkot">Pengkot</option>
                        <option value="pengkab">Pengkab</option>
                        <option value="komcab">Komcab</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Induk Organisasi</label>
                      <select
                        value={formData.parent_id || ''}
                        onChange={e => setFormData({...formData, parent_id: e.target.value ? parseInt(e.target.value) : null})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      >
                        <option value="">-- Tidak ada --</option>
                        {parentOrgs.map(o => (
                          <option key={o.id} value={o.id}>{o.name} ({o.type})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Wilayah</label>
                      <select
                        value={formData.region_id || ''}
                        onChange={e => setFormData({...formData, region_id: e.target.value ? parseInt(e.target.value) : null})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      >
                        <option value="">-- Tidak ada --</option>
                        {allRegions.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nama Ketua</label>
                      <input
                        type="text"
                        value={formData.chairman_name}
                        onChange={e => setFormData({...formData, chairman_name: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                        placeholder="Nama Ketua"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nama Sekretaris</label>
                      <input
                        type="text"
                        value={formData.secretary_name}
                        onChange={e => setFormData({...formData, secretary_name: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                        placeholder="Nama Sekretaris"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                      <textarea
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
                        rows={2}
                        placeholder="Alamat organisasi"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Telepon</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="org_is_active"
                      checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 accent-red-600"
                    />
                    <label htmlFor="org_is_active" className="text-sm text-slate-700">Aktif</label>
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

      {/* Cabor Management Modal */}
      <AnimatePresence>
        {isCaborModalOpen && caborOrg && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsCaborModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Kelola Cabor</h2>
                    <p className="text-sm text-slate-500">{caborOrg.name}</p>
                  </div>
                  <button onClick={() => setIsCaborModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <div className="p-6">
                  {/* Add cabor */}
                  <div className="flex gap-2 mb-4">
                    <select
                      value={selectedCaborId}
                      onChange={e => setSelectedCaborId(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                    >
                      <option value="">Pilih Cabor...</option>
                      {allCabors
                        .filter(c => !caborOrg.cabors?.some(oc => oc.id === c.id))
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))
                      }
                    </select>
                    <button
                      onClick={handleLinkCabor}
                      disabled={!selectedCaborId || linkCaborMutation.isPending}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {linkCaborMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Current cabors */}
                  <div className="space-y-2">
                    {caborOrg.cabors?.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-4">Belum ada cabor terdaftar</p>
                    )}
                    {caborOrg.cabors?.map(c => (
                      <div key={c.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl">
                        <span className="text-sm font-medium text-slate-700">{c.name}</span>
                        <button
                          onClick={() => handleUnlinkCabor(c.id)}
                          disabled={unlinkCaborMutation.isPending}
                          className="p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
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
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => { setIsDeleteModalOpen(false); setDeleteError(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Organisasi?</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Anda yakin ingin menghapus <strong>{orgToDelete?.name}</strong>?
                </p>
                {deleteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">{deleteError}</p>
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
