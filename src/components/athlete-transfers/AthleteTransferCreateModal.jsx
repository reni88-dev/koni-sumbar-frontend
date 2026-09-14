import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  FileText,
  FileUp,
  Loader2,
  RefreshCw,
  Trash2,
  Trophy,
  UserRound,
  X,
} from 'lucide-react';
import {
  useAthleteTransferDestinations,
  useCreateAthleteTransfer,
} from '../../hooks/queries/useAthleteTransfers';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const fileTypeLabels = {
  'application/pdf': 'Dokumen PDF',
  'image/jpeg': 'Gambar JPG',
  'image/png': 'Gambar PNG',
  'image/webp': 'Gambar WebP',
};

const todayJakarta = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

export function AthleteTransferCreateModal({ athlete, isOpen, onClose, onSuccess }) {
  return (
    <AnimatePresence>
      {isOpen && athlete && (
        <AthleteTransferCreateDialog
          key={athlete.id}
          athlete={athlete}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </AnimatePresence>
  );
}

function AthleteTransferCreateDialog({ athlete, onClose, onSuccess }) {
  const [destinationId, setDestinationId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(todayJakarta());
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  const [formError, setFormError] = useState('');
  const dialogRef = useRef(null);
  const fileInputRef = useRef(null);
  const closeRef = useRef(onClose);
  const mutationPendingRef = useRef(false);

  const {
    data: destinations = [],
    isLoading: destinationsLoading,
    isFetching: destinationsFetching,
    isError: destinationsError,
    error: destinationsQueryError,
    refetch: refetchDestinations,
  } = useAthleteTransferDestinations(athlete.id, true);
  const mutation = useCreateAthleteTransfer();
  const maxDate = todayJakarta();
  const titleId = `athlete-transfer-create-title-${athlete.id}`;
  const descriptionId = `athlete-transfer-create-description-${athlete.id}`;

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    mutationPendingRef.current = mutation.isPending;
  }, [mutation.isPending]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 0);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !mutationPendingRef.current) {
        closeRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  const requestClose = () => {
    if (!mutation.isPending) onClose();
  };

  const handleBackdrop = (event) => {
    if (event.target === event.currentTarget) requestClose();
  };

  const chooseFile = () => fileInputRef.current?.click();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    if (!selectedFile) return;

    const validationMessage = validateFile(selectedFile);
    if (validationMessage) {
      setFile(null);
      setFormError(validationMessage);
      return;
    }

    setFile(selectedFile);
    setFormError('');
  };

  const removeFile = () => {
    setFile(null);
    setFormError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (mutation.isPending) return;

    setFormError('');
    if (!destinationId || !effectiveDate || !reason.trim() || !file) {
      setFormError('Lengkapi tujuan, tanggal efektif, alasan, dan surat penerimaan.');
      return;
    }
    if (effectiveDate > maxDate) {
      setFormError('Tanggal efektif tidak boleh melebihi hari ini.');
      return;
    }

    const fileValidationMessage = validateFile(file);
    if (fileValidationMessage) {
      setFormError(fileValidationMessage);
      return;
    }

    const data = new FormData();
    data.append('athlete_id', athlete.id);
    data.append('destination_organization_id', destinationId);
    data.append('effective_date', effectiveDate);
    data.append('reason', reason.trim());
    data.append('acceptance_letter', file);

    try {
      const item = await mutation.mutateAsync(data);
      onSuccess?.(item);
      onClose();
    } catch (error) {
      setFormError(getApiMessage(error, 'Pengajuan transfer gagal dikirim.'));
    }
  };

  const organizationName = athlete.organization?.name
    || athlete.organization_name
    || '-';
  const caborName = athlete.cabor?.display_name
    || athlete.cabor?.name
    || athlete.cabor_name
    || '-';
  const destinationSelectDisabled = destinationsLoading
    || destinationsError
    || destinations.length === 0
    || mutation.isPending;

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={handleBackdrop}
    >
      <Motion.form
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        initial={{ opacity: 0, y: 48, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 48, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
        noValidate
        className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl outline-none sm:max-h-[90vh] sm:rounded-3xl"
      >
        <header className="relative shrink-0 border-b border-slate-100 bg-white px-5 py-4 sm:px-6 sm:py-5">
          <div className="pr-11">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
              Pengajuan Baru
            </div>
            <h2 id={titleId} className="text-lg font-bold text-slate-900 sm:text-xl">
              Ajukan Transfer Atlet
            </h2>
            <p id={descriptionId} className="mt-1 text-sm leading-5 text-slate-500">
              Organisasi baru berlaku setelah persetujuan tujuan dan KONI Sumbar.
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={mutation.isPending}
            aria-label="Tutup modal pengajuan transfer"
            className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40 sm:right-5 sm:top-5"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/40 p-4 sm:p-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Ringkasan Atlet
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryItem icon={UserRound} label="Atlet" value={athlete.name} />
              <SummaryItem icon={Building2} label="Organisasi Asal" value={organizationName} />
              <SummaryItem icon={Trophy} label="Cabang Olahraga" value={caborName} />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
            <div>
              <h3 className="font-bold text-slate-800">Informasi Transfer</h3>
              <p className="mt-0.5 text-sm text-slate-500">
                Pastikan tujuan dan tanggal efektif sudah sesuai dokumen.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="transfer-destination" className="text-sm font-semibold text-slate-700">
                KONI Kab/Kota Tujuan <RequiredMark />
              </label>
              <select
                id="transfer-destination"
                required
                value={destinationId}
                onChange={(event) => {
                  setDestinationId(event.target.value);
                  setFormError('');
                }}
                disabled={destinationSelectDisabled}
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">
                  {destinationsLoading ? 'Memuat tujuan...' : 'Pilih organisasi tujuan'}
                </option>
                {destinations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>

              {destinationsLoading && (
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" aria-hidden="true" />
                  Mengambil organisasi tujuan yang tersedia...
                </p>
              )}
              {destinationsError && (
                <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                  <span>{getApiMessage(destinationsQueryError, 'Daftar organisasi tujuan gagal dimuat.')}</span>
                  <button
                    type="button"
                    onClick={() => refetchDestinations()}
                    disabled={destinationsFetching}
                    className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60 sm:self-auto"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${destinationsFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
                    Coba Lagi
                  </button>
                </div>
              )}
              {!destinationsLoading && !destinationsError && destinations.length === 0 && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Tidak ada organisasi tujuan yang tersedia untuk atlet ini.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="transfer-effective-date" className="text-sm font-semibold text-slate-700">
                Tanggal Efektif <RequiredMark />
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="transfer-effective-date"
                  type="date"
                  required
                  max={maxDate}
                  value={effectiveDate}
                  onChange={(event) => {
                    setEffectiveDate(event.target.value);
                    setFormError('');
                  }}
                  disabled={mutation.isPending}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <p className="text-xs text-slate-500">
                Tanggal efektif tidak boleh melewati tanggal hari ini di Jakarta.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="transfer-reason" className="text-sm font-semibold text-slate-700">
                Alasan Pengajuan <RequiredMark />
              </label>
              <textarea
                id="transfer-reason"
                required
                rows="4"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setFormError('');
                }}
                disabled={mutation.isPending}
                placeholder="Jelaskan alasan perpindahan atlet secara ringkas dan jelas..."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <p className="text-xs text-slate-500">
                Informasi ini akan terlihat oleh organisasi tujuan dan KONI Sumbar.
              </p>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
            <div>
              <h3 className="font-bold text-slate-800">
                Surat Penerimaan <RequiredMark />
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">
                PDF, JPG, PNG, atau WebP dengan ukuran maksimal 10 MB.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Pilih surat penerimaan"
            />

            {file ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{file.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {fileTypeLabels[file.type] || file.type} &bull; {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={chooseFile}
                    disabled={mutation.isPending}
                    className="flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 sm:flex-none"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={removeFile}
                    disabled={mutation.isPending}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 sm:flex-none"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={chooseFile}
                disabled={mutation.isPending}
                className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-4 py-7 text-center transition-all hover:border-red-300 hover:bg-red-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm transition-transform group-hover:-translate-y-0.5">
                  <FileUp className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-bold text-slate-700">Pilih surat penerimaan</span>
                <span className="mt-1 text-xs text-slate-500">Klik untuk memilih file dari perangkat</span>
              </button>
            )}
          </section>

          {formError && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}
        </div>

        <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-100 bg-white p-4 sm:flex sm:justify-end sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={requestClose}
            disabled={mutation.isPending}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || destinationsLoading || destinationsError || destinations.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-500/20 transition-all hover:from-red-700 hover:to-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {mutation.isPending ? 'Mengirim...' : 'Kirim Pengajuan'}
          </button>
        </footer>
      </Motion.form>
    </Motion.div>
  );
}

function SummaryItem({ icon, label, value }) {
  const Icon = icon;
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-slate-50 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-red-600 shadow-xs">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-700">{value || '-'}</p>
      </div>
    </div>
  );
}

function RequiredMark() {
  return <span className="text-red-600" aria-hidden="true">*</span>;
}

function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) return 'Ukuran surat maksimal 10 MB.';
  if (!allowedTypes.includes(file.type)) {
    return 'Surat harus berupa PDF, JPG, PNG, atau WebP.';
  }
  return '';
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getApiMessage(error, fallback) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || fallback;
}