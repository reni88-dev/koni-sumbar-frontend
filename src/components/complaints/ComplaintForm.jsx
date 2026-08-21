import { useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle2, FileImage, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useCreateComplaint } from '../../hooks/queries/useComplaints';
import {
  complaintCategories,
  complaintErrorMessage,
  complaintImpacts,
} from '../../lib/complaints';
import { useComplaintScreenshots } from './useComplaintScreenshots';

function formatBytes(value) {
  if (!Number.isFinite(value)) return '-';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

export function ComplaintForm({ initialPagePath, onCreated }) {
  const createComplaint = useCreateComplaint();
  const submittingRef = useRef(false);
  const fileInputRef = useRef(null);
  const screenshots = useComplaintScreenshots();
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    impact: 'partial',
    triggerSteps: '',
    pagePath: initialPagePath || '',
  });
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const handleFiles = async (event) => {
    const files = event.target.files;
    event.target.value = '';
    await screenshots.addFiles(files);
  };

  const validate = () => {
    if (!form.category) return 'Pilih kategori pengaduan.';
    if (form.title.trim().length < 5) return 'Judul minimal 5 karakter.';
    if (form.description.trim().length < 10) return 'Deskripsi/kronologi minimal 10 karakter.';
    if (!form.impact) return 'Pilih dampak pengaduan.';
    if (form.pagePath.includes('?') || form.pagePath.includes('#')) return 'Halaman terdampak tidak boleh memuat query string atau fragment.';
    if (screenshots.isProcessing) return 'Tunggu seluruh screenshot selesai diproses.';
    if (screenshots.hasErrors) return 'Hapus screenshot yang gagal diproses sebelum mengirim.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current || createComplaint.isPending) return;
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    let whatsappTab = null;
    try {
      whatsappTab = window.open('about:blank', '_blank');
      if (whatsappTab) {
        whatsappTab.document.title = 'Menyiapkan WhatsApp...';
        whatsappTab.document.body.innerHTML = '<p style="font-family:sans-serif;padding:24px">Pengaduan tersimpan. Menyiapkan WhatsApp...</p>';
      }
    } catch {
      whatsappTab = null;
    }

    submittingRef.current = true;
    setError('');
    const affectedPath = form.pagePath.trim().split(/[?#]/)[0];
    const payload = new FormData();
    payload.append('category', form.category);
    payload.append('title', form.title.trim());
    payload.append('description', form.description.trim());
    payload.append('impact', form.impact);
    payload.append('trigger_steps', form.triggerSteps.trim());
    payload.append('page_path', affectedPath);
    payload.append('client_context', JSON.stringify({
      pathname: affectedPath,
      user_agent: navigator.userAgent,
      language: navigator.language,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    }));
    screenshots.readyFiles.forEach((file) => payload.append('screenshots[]', file));

    try {
      const result = await createComplaint.mutateAsync(payload);
      let whatsappOpened = false;
      if (result.whatsapp?.available && result.whatsapp?.url && whatsappTab && !whatsappTab.closed) {
        try {
          whatsappTab.opener = null;
          whatsappTab.location.replace(result.whatsapp.url);
          whatsappOpened = true;
        } catch {
          whatsappOpened = false;
          whatsappTab.close();
        }
      } else if (whatsappTab && !whatsappTab.closed) {
        whatsappTab.close();
      }
      screenshots.clear();
      setForm((current) => ({
        ...current,
        category: '',
        title: '',
        description: '',
        impact: 'partial',
        triggerSteps: '',
      }));
      onCreated({ ...result, whatsappOpened });
    } catch (submitError) {
      if (whatsappTab && !whatsappTab.closed) whatsappTab.close();
      setError(complaintErrorMessage(submitError, 'Pengaduan gagal dikirim. Data form tetap dipertahankan.'));
    } finally {
      submittingRef.current = false;
    }
  };

  const isSubmitting = createComplaint.isPending || submittingRef.current;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Kategori <span className="text-red-600">*</span>
          <select
            value={form.category}
            onChange={(event) => updateField('category', event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
          >
            <option value="">Pilih kategori</option>
            {complaintCategories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Dampak <span className="text-red-600">*</span>
          <select
            value={form.impact}
            onChange={(event) => updateField('impact', event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
          >
            {complaintImpacts.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <span className="block text-xs font-normal text-slate-500">
            {complaintImpacts.find((option) => option.value === form.impact)?.description}
          </span>
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        Judul <span className="text-red-600">*</span>
        <input
          value={form.title}
          maxLength={160}
          onChange={(event) => updateField('title', event.target.value)}
          placeholder="Contoh: Data atlet gagal disimpan"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
        />
        <span className="block text-right text-xs font-normal text-slate-400">{form.title.length}/160</span>
      </label>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        Deskripsi / kronologi <span className="text-red-600">*</span>
        <textarea
          value={form.description}
          maxLength={5000}
          rows={6}
          onChange={(event) => updateField('description', event.target.value)}
          placeholder="Jelaskan apa yang dilakukan, hasil yang muncul, dan hasil yang seharusnya."
          className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
        />
        <span className="block text-right text-xs font-normal text-slate-400">{form.description.length}/5000</span>
      </label>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        Langkah pemicu <span className="font-normal text-slate-400">(opsional)</span>
        <textarea
          value={form.triggerSteps}
          maxLength={3000}
          rows={4}
          onChange={(event) => updateField('triggerSteps', event.target.value)}
          placeholder={'1. Buka menu ...\n2. Pilih ...\n3. Klik Simpan'}
          className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
        />
      </label>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        Halaman / fitur terdampak
        <input
          value={form.pagePath}
          maxLength={500}
          onChange={(event) => updateField('pagePath', event.target.value)}
          placeholder="/dashboard"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
        />
        <span className="block text-xs font-normal text-slate-500">Diisi dari halaman sebelum menu Pengaduan dibuka dan dapat diedit. Query string tidak dikirim.</span>
      </label>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-slate-800"><Camera className="h-5 w-5 text-red-600" /> Screenshot</h3>
            <p className="mt-1 text-xs text-slate-500">Opsional, maksimal {screenshots.maxFiles} file JPG/PNG/WebP, sumber maksimal 10 MB. Gambar diubah ke WebP maksimal 1600 px.</p>
          </div>
          <button
            type="button"
            disabled={screenshots.items.length >= screenshots.maxFiles || screenshots.isProcessing || isSubmitting}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UploadCloud className="h-4 w-4" /> Pilih screenshot
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={screenshots.accept}
            disabled={screenshots.isProcessing || isSubmitting}
            onChange={handleFiles}
            className="hidden"
          />
        </div>

        {screenshots.selectionError && <p role="alert" className="mt-3 text-sm text-red-600">{screenshots.selectionError}</p>}
        {screenshots.items.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {screenshots.items.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex aspect-video items-center justify-center bg-slate-100">
                  {item.previewUrl ? (
                    <img src={item.previewUrl} alt={`Preview ${item.originalName}`} className="h-full w-full object-contain" />
                  ) : item.status === 'processing' ? (
                    <div className="flex flex-col items-center gap-2 text-sm text-slate-500"><Loader2 className="h-7 w-7 animate-spin text-red-600" /> Memproses...</div>
                  ) : (
                    <FileImage className="h-10 w-10 text-slate-300" />
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <p className="truncate text-sm font-medium text-slate-700" title={item.originalName}>{item.originalName}</p>
                  {item.status === 'ready' && (
                    <p className="flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> {formatBytes(item.resultSize)} setelah kompresi</p>
                  )}
                  {item.status === 'error' && <p role="alert" className="text-xs text-red-600">{item.error}</p>}
                  <button
                    type="button"
                    onClick={() => screenshots.remove(item.id)}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        Setelah tiket tersimpan, aplikasi akan membuka WhatsApp Support dengan pesan ringkas. Pesan tetap dikirim oleh Anda dari WhatsApp; deskripsi lengkap dan screenshot tidak dimasukkan ke pesan.
      </div>

      <button
        type="submit"
        disabled={isSubmitting || screenshots.isProcessing}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
        {isSubmitting ? 'Menyimpan pengaduan...' : 'Kirim Pengaduan'}
      </button>
    </form>
  );
}
