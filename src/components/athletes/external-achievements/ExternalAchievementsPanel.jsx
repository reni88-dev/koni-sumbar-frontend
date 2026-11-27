import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle, Award, ExternalLink, Loader2, Pencil, Plus, RefreshCw, Send, Trash2, Undo2, Upload,
} from 'lucide-react';
import { ConfirmDialog } from '../../ConfirmDialog';
import {
  externalAchievementsPath,
  getExternalAchievementError,
  useDeleteExternalAchievement,
  useDeleteExternalAchievementFile,
  useExternalAchievementStatus,
  useExternalAchievements,
  useUploadExternalAchievementFile,
} from '../../../hooks/queries/useExternalAchievements';
import { EvidenceFileList } from './EvidenceFileList';
import { ExternalAchievementFormModal } from './ExternalAchievementFormModal';
import {
  ACCEPTED_EVIDENCE, CATEGORY_LABELS, LEVEL_LABELS, MAX_EVIDENCE_BYTES, MAX_EVIDENCE_FILES,
  STATUS_META, formatPeriod, formatResult, isEditableStatus,
} from './externalAchievementUtils';

const buttonClass = 'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50';

function AchievementCard({ item, athleteId, canEdit, onEdit, onDelete }) {
  const [error, setError] = useState('');
  const status = useExternalAchievementStatus(athleteId);
  const upload = useUploadExternalAchievementFile(athleteId);
  const deleteFile = useDeleteExternalAchievementFile(athleteId);
  const isBusy = status.isPending || upload.isPending || deleteFile.isPending;
  const editable = canEdit && isEditableStatus(item.status);
  const files = item.files || [];
  const meta = STATUS_META[item.status] || STATUS_META.draft;

  const run = async (action, fallback) => {
    setError('');
    try {
      await action();
    } catch (actionError) {
      setError(getExternalAchievementError(actionError, fallback));
    }
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_EVIDENCE_BYTES) {
      setError('Ukuran file bukti maksimal 10 MB');
      return;
    }
    run(() => upload.mutateAsync({ id: item.id, file }), 'Gagal mengunggah file bukti');
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-800 break-words">{item.event_name}</h4>
          <p className="mt-0.5 text-xs text-slate-500">
            {[LEVEL_LABELS[item.level], formatPeriod(item), item.location, item.organizer].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${meta.className}`}>{meta.label}</span>
      </div>

      <p className="mt-2 text-sm text-slate-700">
        <strong>{formatResult(item)}</strong>
        {' — '}
        {[item.cabor_name, item.competition_class, CATEGORY_LABELS[item.category]].filter(Boolean).join(' · ')}
      </p>
      {item.notes && <p className="mt-1 text-xs text-slate-500 whitespace-pre-line">{item.notes}</p>}
      {item.evidence_url && (
        <a href={item.evidence_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline">
          <ExternalLink className="h-3.5 w-3.5" />Link berita / hasil
        </a>
      )}
      {item.status === 'rejected' && item.rejection_reason && (
        <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <strong>Alasan ditolak:</strong> {item.rejection_reason}
        </p>
      )}

      <div className="mt-3">
        <EvidenceFileList
          files={files}
          fileUrl={(file) => `${externalAchievementsPath(athleteId)}/${item.id}/files/${file.id}`}
          onDelete={editable ? (file) => run(() => deleteFile.mutateAsync({ id: item.id, fileId: file.id }), 'Gagal menghapus file bukti') : undefined}
          deleteDisabled={isBusy}
        />
      </div>

      {error && <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-red-600"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}</p>}

      {canEdit && item.status !== 'approved' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {editable && (
            <>
              {files.length < MAX_EVIDENCE_FILES && (
                <label className={`${buttonClass} cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-50 ${isBusy ? 'pointer-events-none opacity-50' : ''}`}>
                  {upload.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Unggah Bukti
                  <input type="file" accept={ACCEPTED_EVIDENCE} onChange={handleUpload} disabled={isBusy} className="sr-only" />
                </label>
              )}
              <button type="button" onClick={() => onEdit(item)} disabled={isBusy} className={`${buttonClass} border-slate-200 text-slate-700 hover:bg-slate-50`}>
                <Pencil className="h-3.5 w-3.5" />Ubah
              </button>
              <button type="button" onClick={() => onDelete(item)} disabled={isBusy} className={`${buttonClass} border-red-200 text-red-600 hover:bg-red-50`}>
                <Trash2 className="h-3.5 w-3.5" />Hapus
              </button>
              <button
                type="button"
                onClick={() => run(() => status.mutateAsync({ id: item.id, action: 'submit' }), 'Gagal mengajukan prestasi')}
                disabled={isBusy || files.length === 0}
                title={files.length === 0 ? 'Unggah file bukti terlebih dahulu' : undefined}
                className={`${buttonClass} border-red-600 bg-red-600 text-white hover:bg-red-700`}
              >
                {status.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Ajukan Verifikasi
              </button>
            </>
          )}
          {item.status === 'submitted' && (
            <button type="button" onClick={() => run(() => status.mutateAsync({ id: item.id, action: 'withdraw' }), 'Gagal menarik pengajuan')} disabled={isBusy} className={`${buttonClass} border-slate-200 text-slate-700 hover:bg-slate-50`}>
              <Undo2 className="h-3.5 w-3.5" />Tarik Pengajuan
            </button>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * Achievements from events outside Sirimau. `athleteId` null shows the logged-in
 * athlete's own data (portal).
 */
export function ExternalAchievementsPanel({ athleteId = null, defaultCaborId, canEdit }) {
  const query = useExternalAchievements(athleteId);
  const remove = useDeleteExternalAchievement(athleteId);
  const [form, setForm] = useState({ open: false, item: null });
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const items = query.data || [];

  const handleDelete = async () => {
    setDeleteError('');
    try {
      await remove.mutateAsync({ id: deleting.id });
    } catch (error) {
      setDeleteError(getExternalAchievementError(error, 'Gagal menghapus prestasi'));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Award className="h-4 w-4 text-amber-500" />Prestasi di Luar Sirimau</h3>
          <p className="text-xs text-slate-500">PON, POPDA, Kejurnas, dan event lain. Resmi setelah diverifikasi KONI Sumbar.</p>
        </div>
        {canEdit && (
          <button type="button" onClick={() => setForm({ open: true, item: null })} className={`${buttonClass} border-red-600 bg-red-600 text-white hover:bg-red-700`}>
            <Plus className="h-3.5 w-3.5" />Tambah Prestasi
          </button>
        )}
      </div>

      {deleteError && <p role="alert" className="mb-3 text-xs text-red-600">{deleteError}</p>}

      {query.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Memuat prestasi...</p>
      ) : query.isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <p>{getExternalAchievementError(query.error, 'Data prestasi belum dapat dimuat.')}</p>
          <button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className={`${buttonClass} mt-3 border-red-200 hover:bg-red-100`}>
            <RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? 'animate-spin' : ''}`} />Coba Lagi
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Belum ada prestasi dari event di luar Sirimau.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <AchievementCard
              key={item.id}
              item={item}
              athleteId={athleteId}
              canEdit={canEdit}
              onEdit={(selected) => setForm({ open: true, item: selected })}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      {form.open && (
        <ExternalAchievementFormModal
          athleteId={athleteId}
          item={form.item}
          defaultCaborId={defaultCaborId}
          onClose={() => setForm({ open: false, item: null })}
          onSaved={() => setForm({ open: false, item: null })}
        />
      )}

      {createPortal(
        <div className="relative z-[60]">
          <ConfirmDialog
            isOpen={Boolean(deleting)}
            onClose={() => setDeleting(null)}
            onConfirm={handleDelete}
            title="Hapus Prestasi"
            message={`Hapus prestasi "${deleting?.event_name || ''}"?`}
            isPending={remove.isPending}
          />
        </div>,
        document.body,
      )}
    </div>
  );
}
