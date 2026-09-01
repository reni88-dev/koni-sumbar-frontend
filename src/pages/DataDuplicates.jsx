import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  ShieldQuestion,
  Sparkles,
  Trash2,
  UserRoundSearch,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { usePermission } from '../hooks/usePermission';
import {
  useDataDuplicates,
  useDeleteDataDuplicateRecord,
  useRefreshDataDuplicates,
  useReviewDataDuplicate,
} from '../hooks/queries/useDataAnalysis';
import {
  duplicateDeleteConfirmation,
  duplicateLoginRecommendation,
  duplicateRecordKey,
  isGuidedDuplicateResolution,
} from '../lib/dataDuplicates';

const ENTITY_TABS = [
  { key: 'athlete', label: 'Atlet', icon: UserRoundSearch },
  { key: 'coach', label: 'Pelatih', icon: ShieldQuestion },
  { key: 'dual_role', label: 'Peran Ganda', icon: UsersRound },
];

const REVIEW_OPTIONS = [
  { value: 'needs_review', label: 'Perlu Review' },
  { value: 'same_person', label: 'Orang yang Sama' },
  { value: 'different_person', label: 'Orang Berbeda' },
];

function apiErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

function number(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

function confidenceStyle(confidence) {
  return confidence === 'high'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';
}

function reviewLabel(status, entity) {
  if (status === 'same_person') {
    return entity === 'dual_role' ? 'Peran Ganda Terkonfirmasi' : 'Duplikat Terkonfirmasi';
  }
  if (status === 'different_person') return 'Orang Berbeda';
  if (status === 'needs_review') return 'Perlu Review';
  return 'Belum Direview';
}

function reviewStyle(status) {
  if (status === 'same_person') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'different_person') return 'bg-slate-100 text-slate-600 border-slate-200';
  if (status === 'needs_review') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function matchStyle(status) {
  if (status === 'same') return 'border-emerald-200 bg-emerald-50/70';
  if (status === 'similar' || status === 'swapped' || status === 'near') return 'border-amber-200 bg-amber-50/70';
  if (status === 'missing') return 'border-slate-200 bg-slate-50';
  if (status === 'conflict') return 'border-red-200 bg-red-50/70';
  return 'border-slate-200 bg-white';
}

function fieldValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return value;
}

function genderLabel(value) {
  if (value === 'male') return 'Laki-laki';
  if (value === 'female') return 'Perempuan';
  return fieldValue(value);
}

function entityLabel(record) {
  return record?.entity_type === 'coach' ? 'Pelatih' : 'Atlet';
}

function formatLoginTime(value) {
  if (!value) return 'Waktu login tidak tersedia';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Waktu login tidak tersedia';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

function RecommendationBadge({ type }) {
  if (!type) return null;
  const keep = type === 'keep';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${keep
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-red-200 bg-red-50 text-red-700'}`}
    >
      {keep ? <BadgeCheck className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
      {keep ? 'Direkomendasikan dipertahankan' : 'Direkomendasikan dihapus'}
    </span>
  );
}

function AccountStatusPanel({ account, compact = false }) {
  if (!account?.linked) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-slate-100 text-slate-600 ${compact ? 'p-3' : 'p-3.5'}`}>
        <div className="flex items-start gap-2.5">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <div>
            <p className="text-sm font-bold">Informasi akun tidak tersedia</p>
            <p className="mt-0.5 text-xs text-slate-500">User aktif tidak ditemukan atau keterkaitan akun tidak valid.</p>
          </div>
        </div>
      </div>
    );
  }

  const loggedIn = Boolean(account.has_logged_in);
  return (
    <div className={`grid gap-2.5 ${compact ? '' : 'sm:grid-cols-2'}`}>
      <div className={`rounded-xl border p-3.5 ${loggedIn
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-amber-200 bg-amber-50 text-amber-800'}`}
      >
        <div className="flex items-start gap-2.5">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-sm font-bold">{loggedIn ? 'Pernah login' : 'Belum pernah login'}</p>
            <p className="mt-0.5 text-xs opacity-80">
              {loggedIn ? `Login terakhir ${formatLoginTime(account.last_login_at)}` : 'Belum ada login berhasil yang tercatat.'}
            </p>
            {loggedIn && account.must_reset_password && (
              <p className="mt-1.5 text-xs font-semibold">Akun saat ini tetap diwajibkan mengganti password.</p>
            )}
          </div>
        </div>
      </div>
      <div className={`rounded-xl border p-3.5 ${account.must_reset_password
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-slate-200 bg-slate-50 text-slate-700'}`}
      >
        <div className="flex items-start gap-2.5">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-sm font-bold">Status password</p>
            <p className="mt-0.5 text-xs opacity-80">
              {account.must_reset_password ? 'Wajib mengganti password' : 'Tidak wajib reset password'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecordPanel({ record, matchDetails, canOpen, onOpen, recommendation }) {
  const fields = [
    { key: 'name', label: 'Nama', value: record.name, match: matchDetails.name },
    { key: 'nik', label: 'NIK', value: record.nik_display, match: matchDetails.nik, visibility: record.nik_visibility },
    { key: 'birth_date', label: 'Tanggal lahir', value: record.birth_date, match: matchDetails.birth_date },
    { key: 'gender', label: 'Gender', value: genderLabel(record.gender) },
    { key: 'cabor', label: 'Cabang olahraga', value: record.cabor_name },
    { key: 'organization', label: 'Organisasi', value: record.organization_name },
    { key: 'account_email', label: 'Email akun', value: record.account?.email_display, visibility: record.account?.email_visibility },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {entityLabel(record)} #{record.id}
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-800">{record.name}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:max-w-[65%] sm:justify-end">
          <RecommendationBadge type={recommendation} />
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${record.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {record.is_active ? 'Aktif' : 'Tidak aktif'}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {fields.map((field) => (
          <div key={field.key} className={`rounded-xl border p-3 ${matchStyle(field.match?.status)}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-500">{field.label}</p>
              {field.visibility && field.visibility !== 'full' && field.visibility !== 'missing' && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {field.visibility === 'masked' ? 'Disamarkan' : 'Tidak tersedia'}
                </span>
              )}
            </div>
            <p className="mt-1 break-words text-sm font-semibold text-slate-800">{fieldValue(field.value)}</p>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <AccountStatusPanel account={record.account} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{record.account?.linked ? 'Akun user aktif terhubung' : 'Akun user aktif tidak tersedia'}</span>
        {canOpen && (
          <button type="button" onClick={onOpen} className="inline-flex items-center gap-1.5 font-semibold text-red-600 hover:text-red-700">
            Buka data
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
function ReviewEditor({ candidate, canReview }) {
  const initialStatus = candidate.review?.stale
    ? ''
    : (candidate.review?.stored_status || (candidate.review?.status === 'unreviewed' ? '' : candidate.review?.status) || '');
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(candidate.review?.note || '');
  const [feedback, setFeedback] = useState('');
  const mutation = useReviewDataDuplicate();

  if (!canReview) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Anda dapat meninjau hasil, tetapi tidak memiliki izin untuk mengubah status review.
      </div>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    setFeedback('');
    if (!status) {
      setFeedback('Pilih status review terlebih dahulu.');
      return;
    }
    try {
      await mutation.mutateAsync({ pair_key: candidate.pair_key, status, note: note.trim() });
      setFeedback('Review berhasil disimpan.');
    } catch (error) {
      setFeedback(apiErrorMessage(error, 'Review gagal disimpan. Silakan coba lagi.'));
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Status review</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          >
            <option value="">Pilih status</option>
            {REVIEW_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value === 'same_person'
                  ? (candidate.entity === 'dual_role' ? 'Peran Ganda Terkonfirmasi' : 'Duplikat Terkonfirmasi')
                  : option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
            Catatan opsional
            <span className="font-normal text-slate-400">{note.length}/500</span>
          </span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, 500))}
            placeholder="Contoh: diverifikasi dari dokumen sumber"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />
        </label>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan
        </button>
      </div>
      {feedback && (
        <p className={`mt-3 text-sm ${mutation.isError ? 'text-red-600' : 'text-emerald-600'}`}>{feedback}</p>
      )}
    </form>
  );
}

function ResolutionRecordChoice({ record, selected, onSelect, recommendation, disabled }) {
  return (
    <label className={`block cursor-pointer rounded-2xl border p-4 transition ${selected
      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-100'
      : 'border-slate-200 bg-white hover:border-slate-300'} ${disabled ? 'pointer-events-none opacity-70' : ''}`}
    >
      <div className="flex items-start gap-3">
        <input
          type="radio"
          name="retained-record"
          value={duplicateRecordKey(record)}
          checked={selected}
          onChange={onSelect}
          disabled={disabled}
          className="mt-1 h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {entityLabel(record)} #{record.id}
              </p>
              <p className="mt-1 font-bold text-slate-800">{record.name}</p>
            </div>
            <RecommendationBadge type={recommendation} />
          </div>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              Email akun
              {record.account?.email_visibility === 'masked' && <span className="ml-auto text-[10px] uppercase">Disamarkan</span>}
            </div>
            <p className="mt-1 break-words text-sm font-bold text-slate-800">{fieldValue(record.account?.email_display)}</p>
          </div>
          <div className="mt-3">
            <AccountStatusPanel account={record.account} compact />
          </div>
          <p className="mt-3 text-xs font-semibold text-emerald-700">
            {selected ? 'Record ini akan dipertahankan.' : 'Pilih untuk mempertahankan record ini.'}
          </p>
        </div>
      </div>
    </label>
  );
}

function DuplicateResolutionModal({ candidate, recommendation, onClose, onDeleted, onMessage }) {
  const [retainedKey, setRetainedKey] = useState('');
  const [impactConfirmed, setImpactConfirmed] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');
  const [deleteCompleted, setDeleteCompleted] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const deleteMutation = useDeleteDataDuplicateRecord();
  const refreshMutation = useRefreshDataDuplicates();
  const firstKey = duplicateRecordKey(candidate.record_a);
  const secondKey = duplicateRecordKey(candidate.record_b);
  const deleteTarget = retainedKey === firstKey
    ? candidate.record_b
    : retainedKey === secondKey
      ? candidate.record_a
      : null;
  const expectedConfirmation = duplicateDeleteConfirmation(deleteTarget);
  const deletingLoggedIn = Boolean(deleteTarget?.account?.linked && deleteTarget.account.has_logged_in);
  const pending = deleteMutation.isPending || refreshMutation.isPending;
  const canSubmit = Boolean(
    deleteTarget
    && confirmationText === expectedConfirmation
    && (!deletingLoggedIn || impactConfirmed)
    && !pending,
  );

  const selectRetained = (record) => {
    setRetainedKey(duplicateRecordKey(record));
    setImpactConfirmed(false);
    setConfirmationText('');
    setError('');
  };

  const close = () => {
    if (!pending) onClose();
  };

  const refreshAfterDelete = async () => {
    setError('');
    try {
      await refreshMutation.mutateAsync();
      onMessage('Resolusi duplikat selesai dan analisis telah diperbarui.', 'success');
      onClose();
    } catch (refreshError) {
      setRefreshFailed(true);
      const message = apiErrorMessage(
        refreshError,
        'Record berhasil dihapus, tetapi analisis ulang gagal. Jangan ulangi penghapusan.',
      );
      setError(message);
      onMessage(message, 'error');
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError('');
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      setDeleteCompleted(true);
      onDeleted(deleteTarget);
      await refreshAfterDelete();
    } catch (deleteError) {
      setError(apiErrorMessage(deleteError, 'Penghapusan gagal. Record belum diubah dan modal tetap terbuka.'));
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 py-4 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="duplicate-resolution-title">
      <div className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">Resolusi terpandu</p>
            <h2 id="duplicate-resolution-title" className="mt-1 text-xl font-bold text-slate-900">Selesaikan Duplikat</h2>
            <p className="mt-1 text-sm text-slate-500">Pilih record yang dipertahankan. Pilihan tidak pernah diisi otomatis.</p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="space-y-5 p-4 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <ResolutionRecordChoice
                record={candidate.record_a}
                selected={retainedKey === firstKey}
                onSelect={() => selectRetained(candidate.record_a)}
                recommendation={recommendation?.keepKey === firstKey ? 'keep' : recommendation?.deleteKey === firstKey ? 'delete' : ''}
                disabled={deleteCompleted}
              />
              <ResolutionRecordChoice
                record={candidate.record_b}
                selected={retainedKey === secondKey}
                onSelect={() => selectRetained(candidate.record_b)}
                recommendation={recommendation?.keepKey === secondKey ? 'keep' : recommendation?.deleteKey === secondKey ? 'delete' : ''}
                disabled={deleteCompleted}
              />
            </div>
            {deleteCompleted ? (
              <div className={`rounded-2xl border p-5 ${refreshFailed
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-blue-200 bg-blue-50 text-blue-900'}`}
              >
                <div className="flex items-start gap-3">
                  {refreshFailed
                    ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    : <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />}
                  <div>
                    <p className="font-bold">
                      {refreshFailed ? 'Penghapusan berhasil, analisis ulang gagal' : 'Record telah dihapus, memperbarui analisis'}
                    </p>
                    <p className="mt-1 text-sm opacity-80">
                      {refreshFailed
                        ? 'Jangan menekan hapus lagi. Jalankan Analisis Ulang untuk membersihkan kandidat tersimpan.'
                        : 'Mohon tunggu sampai kandidat duplikat diperbarui.'}
                    </p>
                  </div>
                </div>
                {error && <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm font-medium">{error}</p>}
                {refreshFailed && (
                  <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={close} className="rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-semibold hover:bg-white/60">
                      Tutup
                    </button>
                    <button
                      type="button"
                      onClick={refreshAfterDelete}
                      disabled={refreshMutation.isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-60"
                    >
                      {refreshMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Analisis Ulang
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {deleteTarget ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
                    <div className="flex items-start gap-3">
                      <Trash2 className="mt-0.5 h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-bold">Target penghapusan: {entityLabel(deleteTarget)} #{deleteTarget.id}</p>
                        <p className="mt-1 text-sm text-red-800">
                          {deleteTarget.name} akan di-soft-delete. Akun user terhubung akan dinonaktifkan dan media record akan dihapus.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800">
                    Pilih salah satu record di atas untuk dipertahankan.
                  </div>
                )}

                {deletingLoggedIn && (
                  <div className="rounded-2xl border-2 border-red-400 bg-red-100 p-4 text-red-950">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-700" />
                      <div>
                        <p className="font-extrabold">Peringatan prioritas tinggi: akun ini pernah login</p>
                        <p className="mt-1 text-sm font-semibold">Login terakhir {formatLoginTime(deleteTarget.account.last_login_at)}.</p>
                        <p className="mt-2 text-sm">
                          Jika dilanjutkan, akun yang pernah digunakan untuk login ikut dinonaktifkan dan media record ikut dihapus.
                        </p>
                        <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-red-300 bg-white/70 p-3 text-sm font-semibold">
                          <input
                            type="checkbox"
                            checked={impactConfirmed}
                            onChange={(event) => setImpactConfirmed(event.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                          />
                          Saya memahami dampak penonaktifan akun yang pernah login dan penghapusan media.
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {deleteTarget && (
                  <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <span className="block text-sm font-bold text-slate-800">Konfirmasi teks wajib</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Ketik persis <strong>{expectedConfirmation}</strong>
                    </span>
                    <input
                      value={confirmationText}
                      onChange={(event) => setConfirmationText(event.target.value)}
                      autoComplete="off"
                      className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      placeholder={expectedConfirmation}
                    />
                  </label>
                )}

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          {!deleteCompleted && (
            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Hapus Record Duplikat
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function CandidateCard({ candidate, canReview, canOpenAthlete, canOpenCoach, canDelete, onResolve }) {
  const navigate = useNavigate();
  const recommendation = duplicateLoginRecommendation(candidate);
  const canOpen = (record) => record.entity_type === 'athlete' ? canOpenAthlete : canOpenCoach;
  const openRecord = (record) => {
    const path = record.entity_type === 'athlete' ? '/atlet' : '/pelatih';
    navigate(`${path}?search=${encodeURIComponent(record.name)}`);
  };
  const recommendationFor = (record) => {
    const key = duplicateRecordKey(record);
    if (recommendation?.keepKey === key) return 'keep';
    if (recommendation?.deleteKey === key) return 'delete';
    return '';
  };
  const canResolve = canReview && canDelete && isGuidedDuplicateResolution(candidate);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${confidenceStyle(candidate.confidence)}`}>
            Skor {candidate.score} · {candidate.confidence === 'high' ? 'Tinggi' : 'Suspek'}
          </span>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${reviewStyle(candidate.review?.status)}`}>
            {reviewLabel(candidate.review?.status, candidate.entity)}
          </span>
          {candidate.review?.stale && (
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              <CircleAlert className="h-3.5 w-3.5" />
              Review kedaluwarsa
            </span>
          )}
        </div>
        <p className="break-all text-xs text-slate-400">{candidate.pair_key}</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {candidate.reasons?.map((reason) => (
          <span key={reason} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {reason}
          </span>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecordPanel
          record={candidate.record_a}
          matchDetails={candidate.match_details}
          canOpen={canOpen(candidate.record_a)}
          onOpen={() => openRecord(candidate.record_a)}
          recommendation={recommendationFor(candidate.record_a)}
        />
        <RecordPanel
          record={candidate.record_b}
          matchDetails={candidate.match_details}
          canOpen={canOpen(candidate.record_b)}
          onOpen={() => openRecord(candidate.record_b)}
          recommendation={recommendationFor(candidate.record_b)}
        />
      </div>

      {canResolve && (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-red-900">Pasangan siap diselesaikan</p>
            <p className="mt-1 text-sm text-red-700">
              {recommendation
                ? 'Riwayat login memberi rekomendasi, tetapi pilihan akhir tetap harus ditentukan admin.'
                : 'Tidak ada rekomendasi otomatis. Bandingkan kedua akun sebelum memilih record.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onResolve(candidate)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Selesaikan Duplikat
          </button>
        </div>
      )}

      <div className="mt-5">
        <ReviewEditor candidate={candidate} canReview={canReview} />
      </div>

    </article>
  );
}

function MetricCard({ label, value, icon, tone }) {
  const IconComponent = icon;
  const tones = {
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{number(value)}</p>
        </div>
        <div className={`rounded-xl p-3 ${tones[tone]}`}>
          <IconComponent className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="space-y-5">
      {[1, 2].map((item) => (
        <div key={item} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5 h-6 w-56 rounded bg-slate-200" />
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2].map((panel) => (
              <div key={panel} className="space-y-3 rounded-xl border border-slate-100 p-4">
                <div className="h-5 w-2/3 rounded bg-slate-200" />
                {[1, 2, 3, 4].map((row) => <div key={row} className="h-14 rounded bg-slate-100" />)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
export function DataDuplicatesPage() {
  const { can } = usePermission();
  const canReview = can('data_duplicates.review');
  const canDeleteAthlete = can('athletes.delete');
  const canDeleteCoach = can('coaches.delete');
  const [entity, setEntity] = useState('athlete');
  const [confidence, setConfidence] = useState('all');
  const [reviewStatus, setReviewStatus] = useState('all');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshMessage, setRefreshMessage] = useState(null);
  const [deletedRecordKeys, setDeletedRecordKeys] = useState(() => new Set());
  const [resolutionCandidate, setResolutionCandidate] = useState(null);
  const filters = { entity, confidence, reviewStatus, search, page, perPage: 20 };
  const query = useDataDuplicates(filters);
  const refresh = useRefreshDataDuplicates();
  const counts = query.data?.counts || {};
  const visibleCandidates = (query.data?.data || []).filter((candidate) => (
    !deletedRecordKeys.has(duplicateRecordKey(candidate.record_a))
    && !deletedRecordKeys.has(duplicateRecordKey(candidate.record_b))
  ));

  const changeEntity = (value) => {
    setEntity(value);
    setPage(1);
  };

  const rerun = async () => {
    setRefreshMessage(null);
    try {
      const result = await refresh.mutateAsync();
      const total = Object.values(result.counts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
      setRefreshMessage({ tone: 'success', text: `Analisis ulang selesai. ${number(total)} kandidat ditemukan.` });
    } catch (error) {
      setRefreshMessage({ tone: 'error', text: apiErrorMessage(error, 'Analisis ulang gagal. Silakan coba lagi.') });
    }
  };

  const hideDeletedRecord = (record) => {
    const key = duplicateRecordKey(record);
    setDeletedRecordKeys((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });
    setPage(1);
    setRefreshMessage({
      tone: 'info',
      text: `${entityLabel(record)} #${record.id} berhasil dihapus. Analisis duplikat sedang diperbarui.`,
    });
  };

  const candidateKey = (candidate) => [
    candidate.pair_key,
    candidate.review?.reviewed_at || candidate.review?.status,
    candidate.review?.stale,
    candidate.record_a?.updated_at,
    candidate.record_b?.updated_at,
    candidate.record_a?.account?.email_display,
    candidate.record_a?.account?.last_login_at,
    candidate.record_a?.account?.must_reset_password,
    candidate.record_b?.account?.email_display,
    candidate.record_b?.account?.last_login_at,
    candidate.record_b?.account?.must_reset_password,
  ].join('-');

  return (
    <DashboardLayout
      title="Analisis Duplikat"
      subtitle="Tinjau kemiripan data, sinyal akun, dan selesaikan duplikat yang telah dikonfirmasi."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Confidence tinggi" value={counts.high} icon={BadgeCheck} tone="red" />
          <MetricCard label="Kandidat suspek" value={counts.suspect} icon={AlertCircle} tone="amber" />
          <MetricCard label="Belum direview" value={counts.unreviewed} icon={CalendarDays} tone="blue" />
          <MetricCard label="Terkonfirmasi" value={counts.same_person} icon={CheckCircle2} tone="emerald" />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1">
              {ENTITY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => changeEntity(tab.key)}
                  className={`inline-flex min-w-max items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${entity === tab.key ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs text-slate-500">
                    {number(counts.by_entity?.[tab.key])}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={rerun}
              disabled={refresh.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refresh.isPending ? 'animate-spin' : ''}`} />
              Analisis Ulang
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_210px_auto]">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setSearch(searchDraft.trim());
                    setPage(1);
                  }
                }}
                placeholder="Cari nama kandidat"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </label>
            <select
              value={confidence}
              onChange={(event) => { setConfidence(event.target.value); setPage(1); }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              <option value="all">Semua confidence</option>
              <option value="high">Tinggi</option>
              <option value="suspect">Suspek</option>
            </select>
            <select
              value={reviewStatus}
              onChange={(event) => { setReviewStatus(event.target.value); setPage(1); }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              <option value="all">Semua status review</option>
              <option value="unreviewed">Belum direview</option>
              <option value="needs_review">Perlu review</option>
              <option value="same_person">Orang yang sama</option>
              <option value="different_person">Orang berbeda</option>
            </select>
            <button
              type="button"
              onClick={() => { setSearch(searchDraft.trim()); setPage(1); }}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Terapkan
            </button>
          </div>

          {refreshMessage && (
            <div className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-sm font-semibold ${refreshMessage.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : refreshMessage.tone === 'info'
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
            >
              {refreshMessage.tone === 'error'
                ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{refreshMessage.text}</span>
            </div>
          )}
        </section>

        {query.isLoading ? (
          <LoadingCards />
        ) : query.isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <XCircle className="mx-auto h-10 w-10 text-red-500" />
            <h2 className="mt-3 font-bold text-red-800">Data analisis gagal dimuat</h2>
            <p className="mt-1 text-sm text-red-600">{apiErrorMessage(query.error, 'Terjadi kesalahan saat memuat kandidat.')}</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </button>
          </div>
        ) : visibleCandidates.length ? (
          <div className="space-y-5">
            {visibleCandidates.map((candidate) => (
              <CandidateCard
                key={candidateKey(candidate)}
                candidate={candidate}
                canReview={canReview}
                canOpenAthlete={can('athletes.view')}
                canOpenCoach={can('coaches.view')}
                canDelete={candidate.entity === 'athlete' ? canDeleteAthlete : candidate.entity === 'coach' ? canDeleteCoach : false}
                onResolve={setResolutionCandidate}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h2 className="mt-4 text-lg font-bold text-slate-800">Tidak ada kandidat</h2>
            <p className="mt-1 text-sm text-slate-500">Tidak ada pasangan yang cocok dengan kategori dan filter saat ini.</p>
          </div>
        )}

        {query.data && query.data.last_page > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row">
            <p className="text-sm text-slate-500">
              Halaman {query.data.current_page} dari {query.data.last_page} · {number(query.data.total)} kandidat
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || query.isFetching}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(query.data.last_page, value + 1))}
                disabled={page >= query.data.last_page || query.isFetching}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Berikutnya
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {resolutionCandidate && (
        <DuplicateResolutionModal
          candidate={resolutionCandidate}
          recommendation={duplicateLoginRecommendation(resolutionCandidate)}
          onClose={() => setResolutionCandidate(null)}
          onDeleted={hideDeletedRecord}
          onMessage={(text, tone) => setRefreshMessage({ text, tone })}
        />
      )}
    </DashboardLayout>
  );
}
