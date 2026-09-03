import { useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Layers, Plus, Search, Edit2, Trash2, X, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import {
  useCoachClustersMaster,
  useCreateCoachClusterMaster,
  useUpdateCoachClusterMaster,
  useDeleteCoachClusterMaster,
  useCoachSubClusters,
  useCreateCoachSubCluster,
  useUpdateCoachSubCluster,
  useDeleteCoachSubCluster,
} from '../../hooks/queries/useCoachClusterMaster';
import { getClusterErrorMessage } from '../../utils/clusterErrors';

const emptyCluster = { code: '', name: '', description: '', is_development_cluster: false, is_active: true, sort_order: 0 };
const EMPTY_LIST = [];
const emptySubCluster = { cluster_id: '', code: '', name: '', description: '', is_active: true, sort_order: 0 };

export function CoachClustersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState('');
  const [clusterModal, setClusterModal] = useState({ open: false, mode: 'create', item: null });
  const [subModal, setSubModal] = useState({ open: false, mode: 'create', item: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [clusterForm, setClusterForm] = useState(emptyCluster);
  const [subForm, setSubForm] = useState(emptySubCluster);
  const [error, setError] = useState('');

  const { data: clustersData, isLoading: loadingClusters, isError: clustersFailed, error: clustersError, refetch: refetchClusters, isFetching: fetchingClusters } = useCoachClustersMaster({ search: debouncedSearch, perPage: 100 });
  const clusters = clustersData?.data || EMPTY_LIST;
  const selectedClusterExists = clusters.some((item) => String(item.id) === String(selectedClusterId));
  const effectiveSelectedClusterId = selectedClusterExists ? String(selectedClusterId) : String(clusters[0]?.id || '');
  const { data: subClustersData, isLoading: loadingSubClusters, isError: subClustersFailed, error: subClustersError, refetch: refetchSubClusters, isFetching: fetchingSubClusters } = useCoachSubClusters({ clusterId: effectiveSelectedClusterId, perPage: 100 });
  const subClusters = subClustersData?.data || EMPTY_LIST;
  const createCluster = useCreateCoachClusterMaster();
  const updateCluster = useUpdateCoachClusterMaster();
  const deleteCluster = useDeleteCoachClusterMaster();
  const createSubCluster = useCreateCoachSubCluster();
  const updateSubCluster = useUpdateCoachSubCluster();
  const deleteSubCluster = useDeleteCoachSubCluster();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);


  const openClusterModal = (mode, item = null) => {
    setError('');
    setClusterForm(item ? { code: item.code, name: item.name, description: item.description || '', is_development_cluster: !!item.is_development_cluster, is_active: !!item.is_active, sort_order: item.sort_order || 0 } : emptyCluster);
    setClusterModal({ open: true, mode, item });
  };

  const openSubModal = (mode, item = null) => {
    setError('');
    setSubForm(item ? { cluster_id: item.cluster_id, code: item.code, name: item.name, description: item.description || '', is_active: !!item.is_active, sort_order: item.sort_order || 0 } : { ...emptySubCluster, cluster_id: effectiveSelectedClusterId });
    setSubModal({ open: true, mode, item });
  };

  const submitCluster = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (clusterModal.mode === 'create') await createCluster.mutateAsync(clusterForm);
      else await updateCluster.mutateAsync({ id: clusterModal.item.id, data: clusterForm });
      setClusterModal({ open: false, mode: 'create', item: null });
    } catch (err) {
      setError(getClusterErrorMessage(err, 'Gagal menyimpan Kluster.'));
    }
  };

  const submitSubCluster = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...subForm, cluster_id: Number(subForm.cluster_id) };
      if (subModal.mode === 'create') await createSubCluster.mutateAsync(payload);
      else await updateSubCluster.mutateAsync({ id: subModal.item.id, data: payload });
      setSubModal({ open: false, mode: 'create', item: null });
    } catch (err) {
      setError(getClusterErrorMessage(err, 'Gagal menyimpan sub-kluster.'));
    }
  };

  const handleDelete = async () => {
    setError('');
    try {
      if (deleteTarget.type === 'cluster') await deleteCluster.mutateAsync(deleteTarget.item.id);
      else await deleteSubCluster.mutateAsync(deleteTarget.item.id);
      setDeleteTarget(null);
    } catch (err) {
      setError(getClusterErrorMessage(err, 'Gagal menghapus data Kluster.'));
    }
  };

  const selectedCluster = clusters.find((item) => String(item.id) === String(effectiveSelectedClusterId));
  const formLoading = createCluster.isPending || updateCluster.isPending || createSubCluster.isPending || updateSubCluster.isPending;

  return (
    <DashboardLayout title="Master Kluster Pelatih" subtitle="Kelola Kluster utama dan sub-kluster pelatih secara dinamis">
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
      {clustersFailed && <QueryLoadError message={getClusterErrorMessage(clustersError, 'Master Kluster belum dapat dimuat.')} loading={fetchingClusters} onRetry={refetchClusters} />}
      {subClustersFailed && <QueryLoadError message={getClusterErrorMessage(subClustersError, 'Master sub-kluster belum dapat dimuat.')} loading={fetchingSubClusters} onRetry={refetchSubClusters} />}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6"><div className="relative max-w-md"><Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari Kluster..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" /></div><button onClick={() => openClusterModal('create')} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"><Plus className="w-5 h-5" /> Tambah Kluster</button></div>
      <div className="grid lg:grid-cols-5 gap-6"><div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"><div className="p-4 border-b border-slate-100 font-semibold text-slate-800">Kluster Utama</div><div className="divide-y divide-slate-100">{loadingClusters ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> : clusters.map((cluster) => <button key={cluster.id} onClick={() => setSelectedClusterId(String(cluster.id))} className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${String(effectiveSelectedClusterId) === String(cluster.id) ? 'bg-red-50' : ''}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-800">{cluster.name}</p><p className="text-xs text-slate-500">{cluster.code}</p></div><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cluster.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{cluster.is_active ? 'Aktif' : 'Nonaktif'}</span></div>{cluster.is_development_cluster && <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-green-700"><ShieldCheck className="w-3.5 h-3.5" /> Binaan KONI</span>}<div className="mt-3 flex gap-2"><span onClick={(e) => { e.stopPropagation(); openClusterModal('edit', cluster); }} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /> Edit</span><span onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'cluster', item: cluster }); }} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /> Hapus</span></div></button>)}{!loadingClusters && clusters.length === 0 && <div className="p-8 text-center text-sm text-slate-500">Tidak ada Kluster</div>}</div></div><div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"><div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-800">Sub-Kluster</p><p className="text-xs text-slate-500">{selectedCluster?.name || 'Pilih Kluster utama'}</p></div><button disabled={!effectiveSelectedClusterId} onClick={() => openSubModal('create')} className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50"><Plus className="w-4 h-4" /> Tambah Sub</button></div><div className="overflow-x-auto"><table className="w-full"><thead className="bg-slate-50 border-b border-slate-100"><tr><th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Nama</th><th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th><th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{loadingSubClusters ? <tr><td colSpan={3} className="px-6 py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" /></td></tr> : subClusters.map((item) => <tr key={item.id} className="hover:bg-slate-50"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Layers className="w-4 h-4 text-blue-600" /></div><div><p className="font-medium text-slate-800">{item.name}</p><p className="text-xs text-slate-500">{item.code}</p></div></div></td><td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{item.is_active ? 'Aktif' : 'Nonaktif'}</span></td><td className="px-6 py-4"><div className="flex justify-end gap-2"><button onClick={() => openSubModal('edit', item)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button><button onClick={() => setDeleteTarget({ type: 'sub', item })} className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div></td></tr>)}{!loadingSubClusters && subClusters.length === 0 && <tr><td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-500">Belum ada sub-kluster</td></tr>}</tbody></table></div></div></div>
      <ClusterModal open={clusterModal.open} mode={clusterModal.mode} form={clusterForm} setForm={setClusterForm} onClose={() => setClusterModal({ open: false, mode: 'create', item: null })} onSubmit={submitCluster} loading={formLoading} />
      <SubClusterModal open={subModal.open} mode={subModal.mode} form={subForm} setForm={setSubForm} clusters={clusters} onClose={() => setSubModal({ open: false, mode: 'create', item: null })} onSubmit={submitSubCluster} loading={formLoading} />
      <DeleteModal target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleteCluster.isPending || deleteSubCluster.isPending} />
    </DashboardLayout>
  );
}

function ClusterModal({ open, mode, form, setForm, onClose, onSubmit, loading }) { if (!open) return null; return <Modal title={mode === 'create' ? 'Tambah Kluster Pelatih' : 'Edit Kluster Pelatih'} onClose={onClose}><form onSubmit={onSubmit} className="p-6 space-y-4"><TextInput label="Kode" value={form.code} onChange={(value) => setForm({ ...form, code: value })} required /><TextInput label="Nama" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required /><TextArea label="Deskripsi" value={form.description} onChange={(value) => setForm({ ...form, description: value })} /><TextInput label="Urutan" type="number" value={form.sort_order} onChange={(value) => setForm({ ...form, sort_order: Number(value) || 0 })} /><CheckInput label="Termasuk Binaan KONI" checked={form.is_development_cluster} onChange={(value) => setForm({ ...form, is_development_cluster: value })} /><CheckInput label="Aktif" checked={form.is_active} onChange={(value) => setForm({ ...form, is_active: value })} /><ModalActions onClose={onClose} loading={loading} /></form></Modal>; }
function SubClusterModal({ open, mode, form, setForm, clusters, onClose, onSubmit, loading }) { if (!open) return null; return <Modal title={mode === 'create' ? 'Tambah Sub-Kluster' : 'Edit Sub-Kluster'} onClose={onClose}><form onSubmit={onSubmit} className="p-6 space-y-4"><label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">Kluster Induk</span><select value={form.cluster_id} onChange={(e) => setForm({ ...form, cluster_id: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" required>{clusters.map((cluster) => <option key={cluster.id} value={cluster.id}>{cluster.name}</option>)}</select></label><TextInput label="Kode" value={form.code} onChange={(value) => setForm({ ...form, code: value })} required /><TextInput label="Nama" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required /><TextArea label="Deskripsi" value={form.description} onChange={(value) => setForm({ ...form, description: value })} /><TextInput label="Urutan" type="number" value={form.sort_order} onChange={(value) => setForm({ ...form, sort_order: Number(value) || 0 })} /><CheckInput label="Aktif" checked={form.is_active} onChange={(value) => setForm({ ...form, is_active: value })} /><ModalActions onClose={onClose} loading={loading} /></form></Modal>; }
function DeleteModal({ target, onClose, onConfirm, loading }) { if (!target) return null; return <Modal title="Hapus Data" onClose={onClose}><div className="p-6"><p className="text-sm text-slate-600">Hapus <strong>{target.item.name}</strong>? Data yang masih digunakan akan ditolak oleh sistem.</p><div className="flex justify-end gap-3 mt-6"><button onClick={onClose} className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">Batal</button><button onClick={onConfirm} disabled={loading} className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50">Hapus</button></div></div></Modal>; }
function Modal({ title, children, onClose }) { return <AnimatePresence><Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={onClose} /><Motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}><div className="p-6 border-b border-slate-100 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-800">{title}</h2><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button></div>{children}</div></Motion.div></AnimatePresence>; }
function TextInput({ label, value, onChange, type = 'text', required = false }) { return <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" required={required} /></label>; }
function TextArea({ label, value, onChange }) { return <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1">{label}</span><textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" /></label>; }
function CheckInput({ label, checked, onChange }) { return <label className="flex items-center gap-3"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500" /><span className="text-sm font-medium text-slate-700">{label}</span></label>; }
function ModalActions({ onClose, loading }) { return <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">Batal</button><button type="submit" disabled={loading} className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">{loading && <Loader2 className="w-4 h-4 animate-spin" />} Simpan</button></div>; }
function QueryLoadError({ message, loading, onRetry }) {
  return <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{message}</span><button type="button" onClick={() => onRetry()} disabled={loading} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Coba Lagi</button></div>;
}