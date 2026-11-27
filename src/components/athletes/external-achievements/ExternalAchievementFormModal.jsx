import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, FileText, Loader2, Paperclip, X } from 'lucide-react';
import { DateInput } from '../../DateInput';
import { useCaborsAll } from '../../../hooks/queries/useCabors';
import {
  getExternalAchievementError,
  useSaveExternalAchievement,
  useUploadExternalAchievementFile,
} from '../../../hooks/queries/useExternalAchievements';
import {
  ACCEPTED_EVIDENCE, CATEGORY_LABELS, EVENT_SUGGESTIONS, LEVEL_LABELS, MAX_EVIDENCE_BYTES, MAX_EVIDENCE_FILES, RESULT_LABELS,
} from './externalAchievementUtils';

const inputClass = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm';
const labelClass = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1';
const EVIDENCE_EXTENSIONS = /\.(pdf|jpe?g|png)$/i;

function initialForm(item, defaultCaborId) {
  return {
    cabor_id: String(item?.cabor_id || defaultCaborId || ''),
    event_name: item?.event_name || '',
    level: item?.level || 'nasional',
    organizer: item?.organizer || '',
    location: item?.location || '',
    start_date: item?.start_date || '',
    end_date: item?.end_date || '',
    competition_class: item?.competition_class || '',
    category: item?.category || 'individual',
    result: item?.result || 'gold',
    rank: item?.rank ? String(item.rank) : '',
    notes: item?.notes || '',
    evidence_url: item?.evidence_url || '',
  };
}

function validate(form, totalFiles) {
  if (!form.event_name.trim()) return 'Nama event wajib diisi';
  if (!form.cabor_id) return 'Cabang olahraga wajib dipilih';
  if (!form.start_date) return 'Tanggal mulai wajib diisi';
  if (form.end_date && form.end_date < form.start_date) return 'Tanggal selesai tidak boleh sebelum tanggal mulai';
  if (form.result === 'rank' && !(Number(form.rank) >= 4)) return 'Peringkat wajib diisi dengan angka 4 atau lebih';
  if (totalFiles === 0) return 'Pilih minimal satu file bukti (sertifikat, piagam, SK, atau foto)';
  if (form.evidence_url.trim() && !/^https?:\/\//i.test(form.evidence_url.trim())) return 'Link harus diawali http:// atau https://';
  return '';
}

function Field({ id, label, required, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>{label}{required && <span className="text-red-500"> *</span>}</label>
      {children}
    </div>
  );
}

const optionsOf = (labels) => Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>);

/**
 * Creates or edits a draft together with its evidence files. The files upload
 * after the data is saved; when one fails the form stays open on the saved
 * draft, so retrying updates it instead of creating a duplicate.
 */
export function ExternalAchievementFormModal({ athleteId, item, defaultCaborId, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialForm(item, defaultCaborId));
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [savedItem, setSavedItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { data: cabors = [], isLoading: caborsLoading } = useCaborsAll();
  const save = useSaveExternalAchievement(athleteId);
  const upload = useUploadExternalAchievementFile(athleteId);
  const current = savedItem || item;
  const existingCount = current?.files?.length || 0;
  const remaining = MAX_EVIDENCE_FILES - existingCount - files.length;
  const isPending = save.isPending || uploading;

  const update = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));

  const addFiles = (event) => {
    const picked = Array.from(event.target.files || []);
    event.target.value = '';
    const rejected = picked.find((file) => !EVIDENCE_EXTENSIONS.test(file.name) || file.size > MAX_EVIDENCE_BYTES);
    if (rejected) {
      setError(`${rejected.name}: file bukti harus PDF, JPG, atau PNG dengan ukuran maksimal 10 MB`);
      return;
    }
    if (picked.length > remaining) {
      setError(`Maksimal ${MAX_EVIDENCE_FILES} file bukti per prestasi`);
      return;
    }
    setError('');
    setFiles((previous) => [...previous, ...picked]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isPending) return;
    const validationError = validate(form, existingCount + files.length);
    setError(validationError);
    if (validationError) return;

    let saved;
    try {
      saved = await save.mutateAsync({
        id: current?.id,
        data: {
          ...form,
          cabor_id: Number(form.cabor_id),
          rank: form.result === 'rank' ? Number(form.rank) : null,
        },
      });
      setSavedItem(saved);
    } catch (saveError) {
      setError(getExternalAchievementError(saveError, 'Gagal menyimpan prestasi'));
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        try {
          saved = await upload.mutateAsync({ id: saved.id, file });
        } catch (uploadError) {
          setError(`Data prestasi tersimpan, tetapi ${file.name} gagal diunggah: ${getExternalAchievementError(uploadError, 'kesalahan tidak diketahui')}. Klik Simpan untuk mencoba lagi.`);
          return;
        }
        setSavedItem(saved);
        setFiles((previous) => previous.filter((pending) => pending !== file));
      }
    } finally {
      setUploading(false);
    }
    onSaved(saved, !item);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-3 sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="external-achievement-title" className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h3 id="external-achievement-title" className="text-lg font-bold text-slate-800">{item ? 'Ubah Prestasi' : 'Tambah Prestasi'}</h3>
          <button type="button" onClick={onClose} disabled={isPending} aria-label="Tutup" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
            <Field id="ea-event" label="Nama Event" required className="sm:col-span-2">
              <input id="ea-event" list="ea-event-suggestions" value={form.event_name} onChange={update('event_name')} maxLength={200} placeholder="mis. PON XXI Aceh-Sumut 2024" className={inputClass} />
              <datalist id="ea-event-suggestions">{EVENT_SUGGESTIONS.map((name) => <option key={name} value={name} />)}</datalist>
            </Field>
            <Field id="ea-level" label="Tingkat" required>
              <select id="ea-level" value={form.level} onChange={update('level')} className={inputClass}>{optionsOf(LEVEL_LABELS)}</select>
            </Field>
            <Field id="ea-cabor" label="Cabang Olahraga" required>
              <select id="ea-cabor" value={form.cabor_id} onChange={update('cabor_id')} disabled={caborsLoading} className={inputClass}>
                <option value="">{caborsLoading ? 'Memuat...' : 'Pilih cabor'}</option>
                {cabors.map((cabor) => <option key={cabor.id} value={cabor.id}>{cabor.name}</option>)}
              </select>
            </Field>
            <Field id="ea-class" label="Nomor / Kelas">
              <input id="ea-class" value={form.competition_class} onChange={update('competition_class')} maxLength={150} placeholder="mis. 100 m gaya bebas putra" className={inputClass} />
            </Field>
            <Field id="ea-category" label="Kategori" required>
              <select id="ea-category" value={form.category} onChange={update('category')} className={inputClass}>{optionsOf(CATEGORY_LABELS)}</select>
            </Field>
            <Field id="ea-result" label="Hasil" required>
              <select id="ea-result" value={form.result} onChange={update('result')} className={inputClass}>{optionsOf(RESULT_LABELS)}</select>
            </Field>
            {form.result === 'rank' && (
              <Field id="ea-rank" label="Peringkat ke-" required>
                <input id="ea-rank" type="number" min="4" max="9999" value={form.rank} onChange={update('rank')} className={inputClass} />
              </Field>
            )}
            <Field id="ea-start" label="Tanggal Mulai" required>
              <DateInput id="ea-start" value={form.start_date} onChange={update('start_date')} className={inputClass} />
            </Field>
            <Field id="ea-end" label="Tanggal Selesai">
              <DateInput id="ea-end" value={form.end_date} min={form.start_date || undefined} onChange={update('end_date')} className={inputClass} />
            </Field>
            <Field id="ea-organizer" label="Penyelenggara">
              <input id="ea-organizer" value={form.organizer} onChange={update('organizer')} maxLength={200} className={inputClass} />
            </Field>
            <Field id="ea-location" label="Lokasi">
              <input id="ea-location" value={form.location} onChange={update('location')} maxLength={200} className={inputClass} />
            </Field>

            <div className="sm:col-span-2">
              <p className={labelClass}>File Bukti<span className="text-red-500"> *</span></p>
              <p className="mb-2 text-xs text-slate-500">Sertifikat, piagam, SK, atau foto penyerahan medali. PDF, JPG, atau PNG, maksimal 10 MB per file, {MAX_EVIDENCE_FILES} file per prestasi.</p>
              {existingCount > 0 && <p className="mb-2 text-xs font-semibold text-slate-600">{existingCount} file sudah tersimpan.</p>}
              {files.length > 0 && (
                <ul className="mb-2 space-y-1.5">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{file.name}</span>
                      <span className="shrink-0 text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button type="button" onClick={() => setFiles((previous) => previous.filter((_, position) => position !== index))} disabled={isPending} aria-label={`Batalkan ${file.name}`} className="rounded p-0.5 text-slate-400 hover:bg-slate-200 disabled:opacity-50">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {remaining > 0 && (
                <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-red-400 hover:bg-red-50 ${isPending ? 'pointer-events-none opacity-50' : ''}`}>
                  <Paperclip className="h-4 w-4" />Pilih File
                  <input type="file" multiple accept={ACCEPTED_EVIDENCE} onChange={addFiles} disabled={isPending} className="sr-only" />
                </label>
              )}
            </div>

            <Field id="ea-url" label="Link Berita / Hasil Resmi (opsional)" className="sm:col-span-2">
              <input id="ea-url" type="url" value={form.evidence_url} onChange={update('evidence_url')} maxLength={500} placeholder="https://..." className={inputClass} />
            </Field>
            <Field id="ea-notes" label="Catatan" className="sm:col-span-2">
              <textarea id="ea-notes" value={form.notes} onChange={update('notes')} maxLength={2000} rows={3} className={inputClass} />
            </Field>
          </div>
          <div className="space-y-3 border-t border-slate-100 p-5">
            {error && <p role="alert" className="flex items-start gap-2 text-sm text-red-600"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} disabled={isPending} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">Batal</button>
              <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploading ? 'Mengunggah file...' : 'Simpan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
