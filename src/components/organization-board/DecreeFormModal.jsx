import { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle, FileText } from 'lucide-react';
import { DateInput } from '../DateInput';
import {
  useSaveOrganizationDecree,
  useUploadOrganizationDecreeFile,
  getDecreeErrorMessage,
} from '../../hooks/queries/useOrganizationDecrees';

const ACCEPTED_FILES = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const inputClass = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm';
const labelClass = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1';

function initialForm(decree) {
  return {
    decree_number: decree?.decree_number || '',
    issued_date: decree?.issued_date || '',
    valid_until: decree?.valid_until || '',
    notes: decree?.notes || '',
  };
}

function validate(form, file) {
  if (!form.decree_number.trim()) return 'Nomor SK wajib diisi';
  if (!form.issued_date) return 'Tanggal diterbitkan wajib diisi';
  if (!form.valid_until) return 'Tanggal berlaku sampai wajib diisi';
  if (form.valid_until < form.issued_date) return 'Tanggal berlaku sampai tidak boleh sebelum tanggal diterbitkan';
  if (file && file.size > MAX_FILE_BYTES) return 'Ukuran file SK maksimal 10 MB';
  return '';
}

// DecreeFormModal creates or edits an SK. A chosen file is uploaded after the
// SK is saved; when only the upload fails the SK stays saved and the error says so.
export function DecreeFormModal({ isOpen, organizationId, decree, onClose, onSaved }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <DecreeForm
          key={decree?.id ?? 'new'}
          organizationId={organizationId}
          decree={decree}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </AnimatePresence>
  );
}

function DecreeForm({ organizationId, decree, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialForm(decree));
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  // Set once a new SK is saved, so a retry after a failed upload updates it instead of creating a duplicate.
  const [savedDecree, setSavedDecree] = useState(null);
  const currentDecree = savedDecree || decree;
  const saveDecree = useSaveOrganizationDecree(organizationId);
  const uploadFile = useUploadOrganizationDecreeFile(organizationId);
  const isPending = saveDecree.isPending || uploadFile.isPending;

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isPending) return;
    const validationError = validate(form, file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');

    let saved;
    try {
      saved = await saveDecree.mutateAsync({
        decreeId: currentDecree?.id,
        data: { ...form, decree_number: form.decree_number.trim(), notes: form.notes.trim() },
      });
      setSavedDecree(saved);
    } catch (saveError) {
      setError(getDecreeErrorMessage(saveError, 'Gagal menyimpan SK. Silakan coba lagi.'));
      return;
    }

    if (file) {
      try {
        await uploadFile.mutateAsync({ decreeId: saved.id, file });
      } catch (uploadError) {
        onSaved?.(saved, false);
        setError(`SK tersimpan, tetapi file gagal diunggah: ${getDecreeErrorMessage(uploadError, 'silakan unggah ulang.')}`);
        return;
      }
    }
    onSaved?.(saved, true);
  };

  return (
    <>
      <Motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
        onClick={isPending ? undefined : onClose}
      />
      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="decree-form-title"
          className="pointer-events-auto bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 id="decree-form-title" className="text-lg font-bold text-slate-800">
              {currentDecree ? 'Edit SK Kepengurusan' : 'Tambah SK Kepengurusan'}
            </h2>
            <button type="button" onClick={onClose} disabled={isPending} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50" aria-label="Tutup">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
            {error && (
              <div role="alert" className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="decree_number" className={labelClass}>Nomor SK <span className="text-red-500">*</span></label>
              <input
                id="decree_number"
                type="text"
                value={form.decree_number}
                onChange={(e) => update('decree_number', e.target.value)}
                maxLength={150}
                className={inputClass}
                placeholder="Contoh: 012/SK/KONI-SB/2026"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="issued_date" className={labelClass}>Tanggal Diterbitkan <span className="text-red-500">*</span></label>
                <DateInput id="issued_date" value={form.issued_date} onChange={(e) => update('issued_date', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="valid_until" className={labelClass}>Berlaku Sampai <span className="text-red-500">*</span></label>
                <DateInput
                  id="valid_until"
                  value={form.valid_until}
                  min={form.issued_date || undefined}
                  onChange={(e) => update('valid_until', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="decree_notes" className={labelClass}>Catatan <span className="font-normal normal-case text-slate-400">(opsional)</span></label>
              <textarea
                id="decree_notes"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={2}
                maxLength={2000}
                className={`${inputClass} resize-none`}
                placeholder="Contoh: Masa bakti 2026–2030"
              />
            </div>
            <div>
              <label htmlFor="decree_file" className={labelClass}>
                File SK <span className="font-normal normal-case text-slate-400">(opsional{currentDecree?.has_file ? ', mengganti file lama' : ''})</span>
              </label>
              <input
                id="decree_file"
                type="file"
                accept={ACCEPTED_FILES}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
              />
              <p className="mt-1 text-xs text-slate-500">PDF, JPG, atau PNG, maksimal 10 MB.</p>
              {currentDecree?.has_file && !file && (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-600"><FileText className="w-3.5 h-3.5" />{currentDecree.file_name}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} disabled={isPending} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                Batal
              </button>
              <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan SK
              </button>
            </div>
          </form>
        </div>
      </Motion.div>
    </>
  );
}
