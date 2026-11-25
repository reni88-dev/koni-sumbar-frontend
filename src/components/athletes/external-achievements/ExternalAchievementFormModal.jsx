import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { DateInput } from '../../DateInput';
import { useCaborsAll } from '../../../hooks/queries/useCabors';
import { getExternalAchievementError, useSaveExternalAchievement } from '../../../hooks/queries/useExternalAchievements';
import { CATEGORY_LABELS, EVENT_SUGGESTIONS, LEVEL_LABELS, RESULT_LABELS } from './externalAchievementUtils';

const inputClass = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm';
const labelClass = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1';

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

function validate(form) {
  if (!form.event_name.trim()) return 'Nama event wajib diisi';
  if (!form.cabor_id) return 'Cabang olahraga wajib dipilih';
  if (!form.start_date) return 'Tanggal mulai wajib diisi';
  if (form.end_date && form.end_date < form.start_date) return 'Tanggal selesai tidak boleh sebelum tanggal mulai';
  if (form.result === 'rank' && !(Number(form.rank) >= 4)) return 'Peringkat wajib diisi dengan angka 4 atau lebih';
  if (form.evidence_url.trim() && !/^https?:\/\//i.test(form.evidence_url.trim())) return 'Link bukti harus diawali http:// atau https://';
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

/** Creates or edits a draft. Mounted only while open, so state starts fresh every time. */
export function ExternalAchievementFormModal({ athleteId, item, defaultCaborId, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialForm(item, defaultCaborId));
  const [error, setError] = useState('');
  const { data: cabors = [], isLoading: caborsLoading } = useCaborsAll();
  const save = useSaveExternalAchievement(athleteId);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (save.isPending) return;
    const validationError = validate(form);
    setError(validationError);
    if (validationError) return;
    try {
      const saved = await save.mutateAsync({
        id: item?.id,
        data: {
          ...form,
          cabor_id: Number(form.cabor_id),
          rank: form.result === 'rank' ? Number(form.rank) : null,
        },
      });
      onSaved(saved, !item);
    } catch (saveError) {
      setError(getExternalAchievementError(saveError, 'Gagal menyimpan prestasi'));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-3 sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="external-achievement-title" className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h3 id="external-achievement-title" className="text-lg font-bold text-slate-800">{item ? 'Ubah Prestasi' : 'Tambah Prestasi'}</h3>
          <button type="button" onClick={onClose} disabled={save.isPending} aria-label="Tutup" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"><X className="h-5 w-5" /></button>
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
            <Field id="ea-url" label="Link Bukti (opsional)" className="sm:col-span-2">
              <input id="ea-url" type="url" value={form.evidence_url} onChange={update('evidence_url')} maxLength={500} placeholder="https://..." className={inputClass} />
            </Field>
            <Field id="ea-notes" label="Catatan" className="sm:col-span-2">
              <textarea id="ea-notes" value={form.notes} onChange={update('notes')} maxLength={2000} rows={3} className={inputClass} />
            </Field>
          </div>
          <div className="space-y-3 border-t border-slate-100 p-5">
            {error && <p role="alert" className="flex items-start gap-2 text-sm text-red-600"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
            {!item && <p className="text-xs text-slate-500">Setelah disimpan sebagai draft, unggah file bukti lalu ajukan verifikasi.</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} disabled={save.isPending} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">Batal</button>
              <button type="submit" disabled={save.isPending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Simpan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
