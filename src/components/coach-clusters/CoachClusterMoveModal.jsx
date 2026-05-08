import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { useMoveCoachCluster } from '../../hooks/queries/useCoachClusters';
import { useCoachClustersAll, useCoachSubClustersByCluster } from '../../hooks/queries/useCoachClusterMaster';
import { CHANGE_TYPES, DECREE_TYPES } from './coachClusterConstants';
import { DateInput } from '../DateInput';

export function CoachClusterMoveModal({ isOpen, onClose, coach }) {
  const moveMutation = useMoveCoachCluster();
  const { data: clusters = [], isLoading: loadingClusters } = useCoachClustersAll();
  const [form, setForm] = useState({
    cluster_id: '',
    sub_cluster_id: '',
    start_date: new Date().toISOString().split('T')[0],
    change_type: 'initial_assignment',
    reason: '',
    decree_number: '',
    decree_date: '',
    decree_title: '',
    decree_type: 'assignment',
    decree_description: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const selectedCluster = clusters.find((item) => String(item.id) === String(form.cluster_id));
  const { data: subClusters = [], isLoading: loadingSubClusters } = useCoachSubClustersByCluster(form.cluster_id);

  useEffect(() => {
    if (isOpen && clusters.length && !form.cluster_id) {
      const currentCluster = clusters.find((item) => String(item.id) === String(coach?.current_cluster_id));
      const fallback = currentCluster || clusters[0];
      setForm((current) => ({ ...current, cluster_id: String(fallback.id), sub_cluster_id: '' }));
    }
  }, [isOpen, clusters, form.cluster_id, coach?.current_cluster_id]);

  useEffect(() => {
    if (!form.cluster_id) return;
    if (!subClusters.length) {
      setForm((current) => current.sub_cluster_id ? { ...current, sub_cluster_id: '' } : current);
      return;
    }
    setForm((current) => {
      if (subClusters.some((item) => String(item.id) === String(current.sub_cluster_id))) return current;
      return { ...current, sub_cluster_id: String(subClusters[0].id) };
    });
  }, [form.cluster_id, subClusters]);

  if (!isOpen || !coach) return null;

  const updateField = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'cluster_id') {
        next.sub_cluster_id = '';
        const cluster = clusters.find((item) => String(item.id) === String(value));
        if (cluster && !cluster.is_development_cluster) {
          if (next.change_type === 'initial_assignment') next.change_type = 'removed';
          if (next.decree_type === 'assignment') next.decree_type = 'removal';
        }
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.cluster_id) return setError('Kluster tujuan wajib dipilih.');
    if (!form.start_date) return setError('Tanggal mulai berlaku wajib diisi.');
    if ((form.change_type === 'removed' || form.change_type === 'demoted') && !form.reason.trim()) return setError('Alasan wajib diisi untuk perubahan ini.');

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== '') data.append(key, value);
    });
    if (file) data.append('file', file);

    try {
      await moveMutation.mutateAsync({ coachId: coach.id, data });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengubah kluster pelatih.');
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[61] flex items-start justify-center p-4 pt-10 overflow-y-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div><h3 className="text-lg font-bold text-slate-800">Ubah Kluster Pelatih</h3><p className="text-sm text-slate-500">{coach.name}</p></div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
          </div>
          <div className="p-6 space-y-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
            {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
            <div className="grid md:grid-cols-2 gap-4">
              <Select label="Kluster Tujuan" value={form.cluster_id} onChange={(value) => updateField('cluster_id', value)} disabled={loadingClusters} placeholder={loadingClusters ? 'Memuat cluster...' : 'Pilih cluster'} options={clusters.map((item) => [item.id, item.name])} />
              {!!form.cluster_id && subClusters.length > 0 && <Select label="Sub-Kluster" value={form.sub_cluster_id} onChange={(value) => updateField('sub_cluster_id', value)} disabled={loadingSubClusters} placeholder="Tanpa sub-kluster" options={subClusters.map((item) => [item.id, item.name])} />}
              {!!selectedCluster?.is_development_cluster && subClusters.length === 0 && <div className="md:col-span-2 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm">Cluster ini termasuk binaan KONI dan tidak memiliki sub-kluster aktif. Sub-kluster akan dikosongkan.</div>}
              <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Tanggal Mulai Berlaku</span><DateInput value={form.start_date} onChange={(e) => updateField('start_date', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" /></label>
              <Select label="Jenis Perubahan" value={form.change_type} onChange={(value) => updateField('change_type', value)} options={CHANGE_TYPES.map((item) => [item.value, item.label])} />
            </div>
            <label className="space-y-1 block"><span className="text-sm font-medium text-slate-700">Alasan</span><textarea value={form.reason} onChange={(e) => updateField('reason', e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" placeholder="Alasan perubahan kluster" /></label>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3"><AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" /><p className="text-sm text-amber-800">SK masih opsional. Isi nomor SK dan unggah file jika dokumen sudah tersedia.</p></div>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Nomor SK" value={form.decree_number} onChange={(value) => updateField('decree_number', value)} />
              <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Tanggal SK</span><DateInput value={form.decree_date} onChange={(e) => updateField('decree_date', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" /></label>
              <Input label="Judul SK" value={form.decree_title} onChange={(value) => updateField('decree_title', value)} />
              <Select label="Jenis SK" value={form.decree_type} onChange={(value) => updateField('decree_type', value)} options={DECREE_TYPES.map((item) => [item.value, item.label])} />
            </div>
            <label className="space-y-1 block"><span className="text-sm font-medium text-slate-700">Keterangan SK</span><textarea value={form.decree_description} onChange={(e) => updateField('decree_description', e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" /></label>
            <label className="flex items-center gap-3 p-4 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"><Upload className="w-5 h-5 text-slate-500" /><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-700">Upload File SK</p><p className="text-xs text-slate-500 truncate">{file?.name || 'PDF/JPG/PNG, maksimal mengikuti batas server'}</p></div><input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100"><button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">Batal</button><button type="submit" disabled={moveMutation.isPending} className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2">{moveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Simpan Perubahan</button></div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}

function Input({ label, value, onChange }) {
  return <label className="space-y-1"><span className="text-sm font-medium text-slate-700">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" /></label>;
}

function Select({ label, value, onChange, options, placeholder, disabled }) {
  return <label className="space-y-1"><span className="text-sm font-medium text-slate-700">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" disabled={disabled}><option value="">{placeholder || 'Pilih'}</option>{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>;
}
