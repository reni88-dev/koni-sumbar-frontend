import { useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Loader2, RefreshCw, Upload, X } from 'lucide-react';
import { useCoachClustersAll, useCoachSubClustersByCluster } from '../../hooks/queries/useCoachClusterMaster';
import { useMoveCoachCluster } from '../../hooks/queries/useCoachClusters';
import { getClusterErrorMessage } from '../../utils/clusterErrors';
import { DateInput } from '../DateInput';
import { CHANGE_TYPES, DECREE_TYPES } from './coachClusterConstants';

const initialForm = () => ({
  cluster_id: '',
  sub_cluster_id: '',
  start_date: new Date(Date.now() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0],
  change_type: 'initial_assignment',
  reason: '',
  decree_number: '',
  decree_date: '',
  decree_title: '',
  decree_type: 'assignment',
  decree_description: '',
});

const allowedFileExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
const EMPTY_LIST = [];

export function CoachClusterMoveModal({ isOpen, onClose, coach }) {
  const moveMutation = useMoveCoachCluster();
  const clustersQuery = useCoachClustersAll();
  const clusters = clustersQuery.data || EMPTY_LIST;
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const defaultCluster = clusters.find((item) => String(item.id) === String(coach?.current_cluster_id)) || clusters[0];
  const effectiveClusterId = form.cluster_id || (defaultCluster ? String(defaultCluster.id) : '');
  const selectedCluster = clusters.find((item) => String(item.id) === effectiveClusterId);
  const subClustersQuery = useCoachSubClustersByCluster(effectiveClusterId);
  const subClusters = subClustersQuery.data || EMPTY_LIST;
  const selectedSubClusterExists = subClusters.some((item) => String(item.id) === String(form.sub_cluster_id));
  const effectiveSubClusterId = selectedCluster?.is_development_cluster
    ? (selectedSubClusterExists ? String(form.sub_cluster_id) : String(subClusters[0]?.id || ''))
    : '';
  if (!isOpen || !coach) return null;

  const updateField = (field, value) => {
    setError('');
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

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    if (!selectedFile) {
      setFile(null);
      return;
    }
    const extension = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!allowedFileExtensions.includes(extension)) {
      event.target.value = '';
      setFile(null);
      setError('File SK harus berupa PDF, JPG, JPEG, atau PNG.');
      return;
    }
    setError('');
    setFile(selectedFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (moveMutation.isPending) return;
    setError('');
    if (!effectiveClusterId) return setError('Kluster tujuan wajib dipilih.');
    if (selectedCluster?.is_development_cluster && subClusters.length > 0 && !effectiveSubClusterId) return setError('Pilih sub-kluster untuk kluster Binaan ini.');
    if (!form.start_date) return setError('Tanggal mulai berlaku wajib diisi.');
    if ((form.change_type === 'removed' || form.change_type === 'demoted') && !form.reason.trim()) return setError('Alasan wajib diisi untuk perubahan ini.');

    const data = new FormData();
    Object.entries({ ...form, cluster_id: effectiveClusterId, sub_cluster_id: effectiveSubClusterId }).forEach(([key, value]) => {
      if (value !== '') data.append(key, value);
    });
    if (file) data.append('file', file);

    try {
      await moveMutation.mutateAsync({ coachId: coach.id, data });
      onClose();
    } catch (requestError) {
      setError(getClusterErrorMessage(requestError, 'Gagal mengubah Kluster pelatih.', {
        permissionMessage: 'Anda tidak memiliki izin untuk mengelola Kluster.',
      }));
    }
  };

  const loadingMaster = clustersQuery.isLoading || subClustersQuery.isLoading;
  const masterFailed = clustersQuery.isError || (Boolean(effectiveClusterId) && subClustersQuery.isError);

  return (
    <AnimatePresence>
      <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm" onClick={moveMutation.isPending ? undefined : onClose} />
      <Motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[61] flex items-start justify-center overflow-y-auto p-4 pt-10">
        <form onSubmit={handleSubmit} className="my-4 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><div><h3 className="text-lg font-bold text-slate-800">Ubah Kluster Pelatih</h3><p className="text-sm text-slate-500">{coach.name}</p></div><button type="button" onClick={onClose} disabled={moveMutation.isPending} className="rounded-lg p-2 transition-colors hover:bg-slate-100 disabled:opacity-50" aria-label="Tutup"><X className="h-5 w-5 text-slate-500" /></button></div>
          <div className="max-h-[calc(100vh-12rem)] space-y-5 overflow-y-auto p-6">
            {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {clustersQuery.isError && <QueryError message={getClusterErrorMessage(clustersQuery.error, 'Master Kluster belum dapat dimuat.')} loading={clustersQuery.isFetching} onRetry={() => clustersQuery.refetch()} />}
            {effectiveClusterId && subClustersQuery.isError && <QueryError message={getClusterErrorMessage(subClustersQuery.error, 'Master sub-kluster belum dapat dimuat.')} loading={subClustersQuery.isFetching} onRetry={() => subClustersQuery.refetch()} />}
            <div className="grid gap-4 md:grid-cols-2">
              <Select label="Kluster Tujuan" value={effectiveClusterId} onChange={(value) => updateField('cluster_id', value)} disabled={clustersQuery.isLoading || clustersQuery.isError} placeholder={clustersQuery.isLoading ? 'Memuat Kluster...' : 'Pilih Kluster'} options={clusters.map((item) => [item.id, item.name])} />
              {!!effectiveClusterId && subClusters.length > 0 && <Select label="Sub-Kluster" value={effectiveSubClusterId} onChange={(value) => updateField('sub_cluster_id', value)} disabled={subClustersQuery.isLoading || subClustersQuery.isError} placeholder="Pilih sub-kluster" options={subClusters.map((item) => [item.id, item.name])} />}
              {!!selectedCluster?.is_development_cluster && !subClustersQuery.isLoading && !subClustersQuery.isError && subClusters.length === 0 && <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700 md:col-span-2">Kluster ini termasuk Binaan KONI dan tidak memiliki sub-kluster aktif. Sub-kluster akan dikosongkan.</div>}
              <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Tanggal Mulai Berlaku</span><DateInput value={form.start_date} onChange={(event) => updateField('start_date', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" /></label>
              <Select label="Jenis Perubahan" value={form.change_type} onChange={(value) => updateField('change_type', value)} options={CHANGE_TYPES.map((item) => [item.value, item.label])} />
            </div>
            <label className="block space-y-1"><span className="text-sm font-medium text-slate-700">Alasan</span><textarea value={form.reason} onChange={(event) => updateField('reason', event.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" placeholder="Alasan perubahan Kluster" /></label>
            <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><p className="text-sm text-amber-800">SK masih opsional. Isi nomor SK dan unggah file jika dokumen sudah tersedia.</p></div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Nomor SK" value={form.decree_number} onChange={(value) => updateField('decree_number', value)} />
              <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Tanggal SK</span><DateInput value={form.decree_date} onChange={(event) => updateField('decree_date', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" /></label>
              <Input label="Judul SK" value={form.decree_title} onChange={(value) => updateField('decree_title', value)} />
              <Select label="Jenis SK" value={form.decree_type} onChange={(value) => updateField('decree_type', value)} options={DECREE_TYPES.map((item) => [item.value, item.label])} />
            </div>
            <label className="block space-y-1"><span className="text-sm font-medium text-slate-700">Keterangan SK</span><textarea value={form.decree_description} onChange={(event) => updateField('decree_description', event.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" /></label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4 hover:bg-slate-50"><Upload className="h-5 w-5 text-slate-500" /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-700">Upload File SK</p><p className="truncate text-xs text-slate-500">{file?.name || 'PDF/JPG/JPEG/PNG'}</p></div><input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} /></label>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4"><button type="button" onClick={onClose} disabled={moveMutation.isPending} className="rounded-xl border border-slate-200 px-4 py-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50">Batal</button><button type="submit" disabled={moveMutation.isPending || loadingMaster || masterFailed} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">{moveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Simpan Perubahan</button></div>
        </form>
      </Motion.div>
    </AnimatePresence>
  );
}

function QueryError({ message, loading, onRetry }) {
  return <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{message}</span><button type="button" onClick={onRetry} disabled={loading} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Coba Lagi</button></div>;
}

function Input({ label, value, onChange }) {
  return <label className="space-y-1"><span className="text-sm font-medium text-slate-700">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" /></label>;
}

function Select({ label, value, onChange, options, placeholder, disabled = false }) {
  return <label className="space-y-1"><span className="text-sm font-medium text-slate-700">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" disabled={disabled}><option value="">{placeholder || 'Pilih'}</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}