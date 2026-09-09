import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  History,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import {
  fetchAthleteTransferDocument,
  useAthleteTransfer,
  useCancelAthleteTransfer,
  useDestinationReviewAthleteTransfer,
  useKoniReviewAthleteTransfer,
} from '../../hooks/queries/useAthleteTransfers';
import { transferStatusLabel, transferStatusStyle } from './transferPresentation';

export function AthleteTransferDetailModal({ id, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && id && (
        <AthleteTransferDetailDialog key={id} id={id} onClose={onClose} />
      )}
    </AnimatePresence>
  );
}

function AthleteTransferDetailDialog({ id, onClose }) {
  const { user } = useAuth();
  const { can } = usePermission();
  const {
    data: item,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useAthleteTransfer(id, true);
  const destinationReview = useDestinationReviewAthleteTransfer();
  const koniReview = useKoniReviewAthleteTransfer();
  const cancelTransfer = useCancelAthleteTransfer();

  const [decision, setDecision] = useState('accept');
  const [reviewReason, setReviewReason] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionBlockers, setActionBlockers] = useState([]);
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentMime, setDocumentMime] = useState('');
  const [documentAction, setDocumentAction] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [documentSuccess, setDocumentSuccess] = useState('');

  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const mutationPendingRef = useRef(false);
  const documentUrlRef = useRef('');
  const mountedRef = useRef(true);

  const orgId = Number(user?.organization_id || user?.organization?.id || 0);
  const canDestinationReview = item?.status === 'pending_destination'
    && can('athlete_transfers.receive')
    && orgId === item.destination_organization_id;
  const canKoniReview = item?.status === 'pending_koni'
    && can('athlete_transfers.approve');
  const canCancel = ['pending_destination', 'pending_koni'].includes(item?.status)
    && can('athlete_transfers.cancel')
    && orgId === item?.source_organization_id
    && Number(user?.id) === item?.submitted_by;
  const mutationPending = destinationReview.isPending
    || koniReview.isPending
    || cancelTransfer.isPending;
  const reviewPending = destinationReview.isPending || koniReview.isPending;
  const titleId = `athlete-transfer-detail-title-${id}`;

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    mutationPendingRef.current = mutationPending;
  }, [mutationPending]);

  useEffect(() => {
    mountedRef.current = true;
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
      mountedRef.current = false;
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (documentUrlRef.current) URL.revokeObjectURL(documentUrlRef.current);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  const requestClose = () => {
    if (!mutationPending) onClose();
  };

  const handleBackdrop = (event) => {
    if (event.target === event.currentTarget) requestClose();
  };

  const clearPreview = () => {
    if (documentUrlRef.current) URL.revokeObjectURL(documentUrlRef.current);
    documentUrlRef.current = '';
    setDocumentUrl('');
    setDocumentMime('');
    setDocumentError('');
    setDocumentSuccess('');
  };

  const openDocument = async (mode) => {
    if (documentAction || !item) return;
    setDocumentAction(mode);
    setDocumentError('');
    setDocumentSuccess('');

    try {
      const blob = await fetchAthleteTransferDocument(id);
      const url = URL.createObjectURL(blob);
      if (!mountedRef.current) {
        URL.revokeObjectURL(url);
        return;
      }

      if (mode === 'download') {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = item.acceptance_letter_name || 'surat-penerimaan';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        setDocumentSuccess('Dokumen berhasil diunduh.');
      } else {
        if (documentUrlRef.current) URL.revokeObjectURL(documentUrlRef.current);
        documentUrlRef.current = url;
        setDocumentUrl(url);
        setDocumentMime(item.acceptance_letter_mime || blob.type);
        setDocumentSuccess('Preview dokumen berhasil dimuat.');
      }
    } catch (error) {
      if (mountedRef.current) {
        setDocumentError(getApiMessage(error, 'Dokumen tidak dapat dibuka.'));
      }
    } finally {
      if (mountedRef.current) setDocumentAction('');
    }
  };

  const clearActionFeedback = () => {
    setActionError('');
    setActionSuccess('');
    setActionBlockers([]);
  };

  const submitReview = async () => {
    if (!item || mutationPending || (!canDestinationReview && !canKoniReview)) return;
    if (decision === 'reject' && !reviewReason.trim()) {
      setActionError('Alasan penolakan wajib diisi.');
      setActionBlockers([]);
      return;
    }

    clearActionFeedback();
    try {
      const mutation = canDestinationReview ? destinationReview : koniReview;
      await mutation.mutateAsync({
        id,
        athleteId: item.athlete_id,
        decision,
        reason: reviewReason.trim(),
      });
      await refetch();
      setReviewReason('');
      setActionSuccess(
        decision === 'accept'
          ? 'Persetujuan transfer berhasil disimpan.'
          : 'Penolakan transfer berhasil disimpan.',
      );
    } catch (error) {
      const blockers = Array.isArray(error?.response?.data?.blockers)
        ? error.response.data.blockers
        : [];
      setActionBlockers(blockers);
      setActionError(getApiMessage(
        error,
        blockers.length
          ? 'Transfer belum dapat diselesaikan karena masih memiliki blocker event.'
          : 'Keputusan gagal diproses.',
      ));
    }
  };

  const submitCancel = async () => {
    if (!item || mutationPending || !canCancel) return;
    if (!cancellationReason.trim()) {
      setActionError('Alasan pembatalan wajib diisi.');
      setActionBlockers([]);
      return;
    }

    clearActionFeedback();
    try {
      await cancelTransfer.mutateAsync({
        id,
        athleteId: item.athlete_id,
        reason: cancellationReason.trim(),
      });
      await refetch();
      setCancellationReason('');
      setActionSuccess('Pengajuan transfer berhasil dibatalkan.');
    } catch (error) {
      setActionError(getApiMessage(error, 'Pembatalan gagal diproses.'));
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={handleBackdrop}
    >
      <Motion.div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 48, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 48, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onMouseDown={(event) => event.stopPropagation()}
        className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl outline-none sm:max-h-[92vh] sm:rounded-3xl"
      >
        <header className="relative shrink-0 border-b border-slate-100 bg-white px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 flex-col gap-2 pr-12 sm:flex-row sm:items-center sm:gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-red-600">Transfer Atlet</p>
              <h2 id={titleId} className="mt-0.5 text-lg font-bold text-slate-900 sm:text-xl">
                Detail Pengajuan
              </h2>
            </div>
            {item && (
              <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-bold ${transferStatusStyle(item.status)}`}>
                {transferStatusLabel(item.status)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={mutationPending}
            aria-label="Tutup detail transfer"
            className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40 sm:right-5 sm:top-5"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6">
          {isLoading ? (
            <DetailSkeleton />
          ) : isError && !item ? (
            <DetailError isFetching={isFetching} onRetry={() => refetch()} />
          ) : item ? (
            <div className="space-y-5">
              {isFetching && (
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" aria-hidden="true" />
                  Memperbarui detail transfer...
                </div>
              )}

              {isError && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <span>Detail terbaru gagal dimuat. Data tersimpan masih ditampilkan.</span>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="font-bold underline decoration-amber-400 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    Coba lagi
                  </button>
                </div>
              )}

              {actionSuccess && (
                <div role="status" className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              <RouteSummary item={item} />
              <SectionCard
                icon={CalendarDays}
                title="Metadata Pengajuan"
                description="Informasi yang tercatat saat transfer diajukan."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Info label="Diajukan Oleh" value={item.submitted_by_name} />
                  <Info label="Waktu Pengajuan" value={formatDateTime(item.submitted_at)} />
                  <Info label="Tanggal Efektif" value={formatDate(item.effective_date)} />
                  <Info label="Cabang Olahraga" value={item.cabor_name_snapshot} />
                  {item.destination_reviewed_at && (
                    <Info
                      label="Review Organisasi Tujuan"
                      value={(
                        <MetadataActor
                          name={item.destination_reviewed_by_name}
                          date={item.destination_reviewed_at}
                        />
                      )}
                    />
                  )}
                  {item.koni_reviewed_at && (
                    <Info
                      label="Review KONI Sumbar"
                      value={(
                        <MetadataActor
                          name={item.koni_reviewed_by_name}
                          date={item.koni_reviewed_at}
                        />
                      )}
                    />
                  )}
                  {item.cancelled_at && (
                    <Info
                      label="Dibatalkan Oleh"
                      value={(
                        <MetadataActor
                          name={item.cancelled_by_name}
                          date={item.cancelled_at}
                        />
                      )}
                    />
                  )}
                  {item.completed_at && (
                    <Info label="Diselesaikan" value={formatDateTime(item.completed_at)} />
                  )}
                  <div className="sm:col-span-2">
                    <Info label="Alasan Pengajuan" value={item.reason} />
                  </div>
                </div>
                <OutcomeMessage item={item} />
              </SectionCard>

              <SectionCard
                icon={FileText}
                title="Dokumen Pendukung"
                description="Surat penerimaan yang dilampirkan pada pengajuan."
              >
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {item.acceptance_letter_name || 'Surat penerimaan'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatMimeType(item.acceptance_letter_mime)} &bull; {formatFileSize(item.acceptance_letter_size)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={() => openDocument('preview')}
                      disabled={Boolean(documentAction)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-wait disabled:opacity-60"
                    >
                      {documentAction === 'preview' ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <FileText className="h-4 w-4" aria-hidden="true" />
                      )}
                      {documentAction === 'preview' ? 'Membuka...' : 'Preview'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openDocument('download')}
                      disabled={Boolean(documentAction)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-wait disabled:opacity-60"
                    >
                      {documentAction === 'download' ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Download className="h-4 w-4" aria-hidden="true" />
                      )}
                      {documentAction === 'download' ? 'Mengunduh...' : 'Unduh'}
                    </button>
                  </div>
                </div>

                {documentError && (
                  <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{documentError}</span>
                  </div>
                )}

                {documentSuccess && (
                  <div role="status" className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{documentSuccess}</span>
                  </div>
                )}

                {documentUrl && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4">
                      <p className="truncate text-xs font-bold text-slate-600">
                        Preview {item.acceptance_letter_name || 'dokumen'}
                      </p>
                      <button
                        type="button"
                        onClick={clearPreview}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        Tutup Preview
                      </button>
                    </div>
                    {documentMime === 'application/pdf' ? (
                      <iframe
                        title="Preview surat penerimaan"
                        src={documentUrl}
                        className="h-[52vh] min-h-80 w-full bg-white sm:h-[560px]"
                      />
                    ) : (
                      <div className="flex max-h-[65vh] min-h-64 items-center justify-center overflow-auto p-3 sm:p-5">
                        <img
                          src={documentUrl}
                          alt="Preview surat penerimaan"
                          className="max-h-[58vh] max-w-full rounded-xl object-contain shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                icon={History}
                title="Timeline Persetujuan"
                description="Urutan perubahan status dan catatan dari setiap aktor."
              >
                {item.actions?.length ? (
                  <div className="relative space-y-4 before:absolute before:bottom-5 before:left-[0.45rem] before:top-5 before:w-px before:bg-slate-200">
                    {item.actions.map((action) => (
                      <div key={action.id} className="relative pl-8">
                        <span className={`absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 border-white ring-1 ring-slate-200 ${timelineDotStyle(action.to_status)}`} />
                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-bold text-slate-800">
                              {transferStatusLabel(action.to_status)}
                            </p>
                            <p className="flex flex-wrap items-center gap-1 text-xs text-slate-400">
                              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                              {formatDateTime(action.created_at)}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {action.actor_name_snapshot || 'Pengguna'}
                            <span className="mx-1.5" aria-hidden="true">&bull;</span>
                            {action.actor_role_snapshot || 'Peran tidak tersedia'}
                          </p>
                          {action.notes && (
                            <p className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-600">
                              {action.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    Belum ada aktivitas persetujuan yang tercatat.
                  </div>
                )}
              </SectionCard>
              {(canDestinationReview || canKoniReview || canCancel) && (
                <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-xs sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-bold text-amber-950">Panel Tindakan</h3>
                      <p className="mt-0.5 text-sm text-amber-800/80">
                        Tindakan akan dicatat pada timeline transfer atlet.
                      </p>
                    </div>
                  </div>

                  {(canDestinationReview || canKoniReview) && (
                    <div className="mt-5 space-y-4 rounded-2xl border border-amber-200 bg-white p-4">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {canDestinationReview
                            ? 'Keputusan Organisasi Tujuan'
                            : 'Keputusan KONI Sumbar'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Catatan bersifat opsional saat menerima dan wajib saat menolak.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Keputusan transfer">
                        <label className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-bold transition-all focus-within:ring-2 focus-within:ring-offset-2 ${
                          decision === 'accept'
                            ? 'border-emerald-300 focus-within:ring-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}>
                          <input
                            type="radio"
                            name="transfer-decision"
                            value="accept"
                            checked={decision === 'accept'}
                            onChange={() => {
                              setDecision('accept');
                              clearActionFeedback();
                            }}
                            disabled={mutationPending}
                            className="sr-only"
                          />
                          Terima
                        </label>
                        <label className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-bold transition-all focus-within:ring-2 focus-within:ring-offset-2 ${
                          decision === 'reject'
                            ? 'border-red-300 focus-within:ring-red-500 bg-red-50 text-red-700 ring-1 ring-red-200'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}>
                          <input
                            type="radio"
                            name="transfer-decision"
                            value="reject"
                            checked={decision === 'reject'}
                            onChange={() => {
                              setDecision('reject');
                              clearActionFeedback();
                            }}
                            disabled={mutationPending}
                            className="sr-only"
                          />
                          Tolak
                        </label>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="transfer-review-reason" className="text-sm font-semibold text-slate-700">
                          {decision === 'reject' ? 'Alasan Penolakan' : 'Catatan Keputusan'}{' '}
                          {decision === 'reject' && <RequiredMark />}
                        </label>
                        <textarea
                          id="transfer-review-reason"
                          rows="3"
                          value={reviewReason}
                          onChange={(event) => {
                            setReviewReason(event.target.value);
                            clearActionFeedback();
                          }}
                          disabled={mutationPending}
                          placeholder={decision === 'reject'
                            ? 'Jelaskan alasan penolakan transfer...'
                            : 'Tambahkan catatan jika diperlukan...'}
                          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={submitReview}
                          disabled={mutationPending}
                          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:w-auto ${
                            decision === 'reject'
                              ? 'bg-red-600 shadow-red-500/20 hover:bg-red-700 focus-visible:ring-red-500'
                              : 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700 focus-visible:ring-emerald-500'
                          }`}
                        >
                          {reviewPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                          {reviewPending ? 'Memproses...' : 'Simpan Keputusan'}
                        </button>
                      </div>
                    </div>
                  )}

                  {canCancel && (
                    <div className="mt-4 space-y-3 rounded-2xl border border-red-200 bg-red-50/80 p-4">
                      <div>
                        <p className="text-sm font-bold text-red-900">Batalkan Pengajuan</p>
                        <p className="mt-0.5 text-xs text-red-700/80">
                          Pembatalan hanya dapat dilakukan oleh pengaju dari organisasi asal.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="transfer-cancellation-reason" className="text-sm font-semibold text-red-900">
                          Alasan Pembatalan <RequiredMark />
                        </label>
                        <textarea
                          id="transfer-cancellation-reason"
                          rows="3"
                          value={cancellationReason}
                          onChange={(event) => {
                            setCancellationReason(event.target.value);
                            clearActionFeedback();
                          }}
                          disabled={mutationPending}
                          placeholder="Jelaskan alasan pembatalan pengajuan..."
                          className="w-full resize-y rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={submitCancel}
                          disabled={mutationPending}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                        >
                          {cancelTransfer.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                          {cancelTransfer.isPending ? 'Membatalkan...' : 'Batalkan Pengajuan'}
                        </button>
                      </div>
                    </div>
                  )}

                  {(actionError || actionBlockers.length > 0) && (
                    <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{actionError}</span>
                      </div>
                      {actionBlockers.length > 0 && (
                        <ul className="mt-3 space-y-2 border-t border-red-200 pt-3">
                          {actionBlockers.map((blocker) => (
                            <li key={`${blocker.kind}-${blocker.event_id}`} className="rounded-lg bg-white/80 px-3 py-2">
                              <p className="font-bold text-red-800">{blocker.event_name || 'Event aktif'}</p>
                              <p className="mt-0.5 text-xs text-red-600">
                                Status partisipasi: {blocker.status || '-'}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </section>
              )}

              {!canDestinationReview && !canKoniReview && !canCancel && actionError && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{actionError}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Motion.div>
    </Motion.div>
  );
}
function RouteSummary({ item }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-5 text-white shadow-lg shadow-slate-900/10 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-red-200 ring-1 ring-white/10">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Atlet</p>
              <h3 className="mt-0.5 truncate text-lg font-bold">
                {item.athlete_name_snapshot || '-'}
              </h3>
              <p className="mt-0.5 text-sm text-slate-300">
                {item.cabor_name_snapshot || 'Cabang olahraga tidak tersedia'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10">
            <CalendarDays className="h-4 w-4 text-red-300" aria-hidden="true" />
            Efektif {formatDate(item.effective_date)}
          </div>
        </div>

        <div className="mt-5 grid items-stretch gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
          <RouteOrganization
            label="Organisasi Asal"
            name={item.source_organization_name_snapshot}
          />
          <span className="mx-auto flex h-9 w-9 rotate-90 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-950/30 sm:rotate-0">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
          <RouteOrganization
            label="Organisasi Tujuan"
            name={item.destination_organization_name_snapshot}
            destination
          />
        </div>
      </div>
    </section>
  );
}

function RouteOrganization({ label, name, destination = false }) {
  return (
    <div className={`rounded-2xl border p-4 ${
      destination
        ? 'border-red-400/30 bg-red-500/15'
        : 'border-white/10 bg-white/5'
    }`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 text-sm font-bold leading-5 text-white">{name || '-'}</p>
    </div>
  );
}

function SectionCard({ icon, title, description, children }) {
  const Icon = icon;
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
      <div className="mb-4 flex items-start gap-3 border-b border-slate-100 pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-bold text-slate-800">{title}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-1 text-sm font-semibold leading-6 text-slate-700">
        {value || '-'}
      </div>
    </div>
  );
}

function MetadataActor({ name, date }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span>{name || 'Pengguna'}</span>
      <span className="text-slate-300" aria-hidden="true">&bull;</span>
      <span className="font-medium text-slate-500">{formatDateTime(date)}</span>
    </span>
  );
}

function OutcomeMessage({ item }) {
  let message = '';
  let label = '';
  let style = '';

  if (item.status === 'completed') {
    label = 'Transfer selesai';
    message = 'Organisasi atlet telah diperbarui ke organisasi tujuan.';
    style = 'border-emerald-200 bg-emerald-50 text-emerald-700';
  } else if (item.status === 'cancelled') {
    label = 'Alasan pembatalan';
    message = item.cancellation_reason;
    style = 'border-slate-200 bg-slate-50 text-slate-600';
  } else if (item.status === 'rejected_destination') {
    label = 'Alasan penolakan organisasi tujuan';
    message = item.destination_review_reason;
    style = 'border-red-200 bg-red-50 text-red-700';
  } else if (item.status === 'rejected_koni') {
    label = 'Alasan penolakan KONI Sumbar';
    message = item.koni_review_reason;
    style = 'border-red-200 bg-red-50 text-red-700';
  }

  if (!message) return null;

  return (
    <div className={`mt-4 rounded-xl border px-3.5 py-3 text-sm ${style}`}>
      <p className="font-bold">{label}</p>
      <p className="mt-1 leading-6">{message}</p>
    </div>
  );
}

function DetailError({ isFetching, onRetry }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-white px-5 py-12 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </span>
      <h3 className="font-bold text-slate-800">Detail transfer gagal dimuat</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
        Data pengajuan belum dapat ditampilkan. Periksa koneksi lalu coba lagi.
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isFetching}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
        {isFetching ? 'Memuat...' : 'Coba Lagi'}
      </button>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5" aria-label="Memuat detail transfer">
      <div className="animate-pulse rounded-2xl bg-slate-900 p-6">
        <div className="h-4 w-24 rounded bg-slate-700" />
        <div className="mt-3 h-6 w-52 rounded bg-slate-600" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="h-20 rounded-2xl bg-slate-800" />
          <div className="h-20 rounded-2xl bg-slate-800" />
        </div>
      </div>
      {[0, 1, 2].map((value) => (
        <div key={value} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5">
          <div className="h-5 w-44 rounded bg-slate-200" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="h-16 rounded-xl bg-slate-100" />
            <div className="h-16 rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RequiredMark() {
  return <span className="text-red-600" aria-hidden="true">*</span>;
}

function timelineDotStyle(status) {
  return ({
    pending_destination: 'bg-amber-500',
    pending_koni: 'bg-blue-500',
    completed: 'bg-emerald-500',
    rejected_destination: 'bg-red-500',
    rejected_koni: 'bg-red-500',
    cancelled: 'bg-slate-400',
  }[status] || 'bg-slate-400');
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Ukuran tidak tersedia';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMimeType(mime) {
  return ({
    'application/pdf': 'Dokumen PDF',
    'image/jpeg': 'Gambar JPG',
    'image/png': 'Gambar PNG',
    'image/webp': 'Gambar WebP',
  }[mime] || mime || 'Tipe tidak tersedia');
}

function getApiMessage(error, fallback) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || fallback;
}