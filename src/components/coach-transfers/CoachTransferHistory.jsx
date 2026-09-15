import { motion as Motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  RefreshCw,
  SearchX,
} from 'lucide-react';
import { useCoachTransferHistory } from '../../hooks/queries/useCoachTransfers';
import { transferStatusLabel, transferStatusStyle } from './transferPresentation';

export function CoachTransferHistory({ coachId }) {
  const {
    data = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useCoachTransferHistory(coachId);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <History className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-bold text-slate-800">Riwayat Transfer Pelatih</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Jejak perpindahan organisasi dan hasil setiap pengajuan.
            </p>
          </div>
        </div>
        {!isLoading && data.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-red-600" aria-label="Memperbarui riwayat" />
            )}
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
              {data.length} transfer
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <HistorySkeleton />
      ) : isError && !data.length ? (
        <HistoryState
          icon={RefreshCw}
          title="Riwayat transfer gagal dimuat"
          description="Data riwayat belum dapat ditampilkan. Silakan coba lagi."
          actionLabel="Coba Lagi"
          onAction={() => refetch()}
          actionPending={isFetching}
          tone="error"
        />
      ) : !data.length ? (
        <HistoryState
          icon={SearchX}
          title="Belum ada riwayat transfer"
          description="Riwayat perpindahan organisasi pelatih ini akan tampil di sini."
        />
      ) : (
        <>
          {isError && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span>Data terbaru gagal dimuat. Riwayat tersimpan masih ditampilkan.</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="font-bold underline decoration-amber-400 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Coba lagi
              </button>
            </div>
          )}

          <div className="relative space-y-4 before:absolute before:bottom-7 before:left-[1.15rem] before:top-7 before:w-px before:bg-slate-200 sm:before:left-[1.4rem]">
            {data.map((item, index) => (
              <Motion.article
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.2) }}
                className="relative pl-10 sm:pl-12"
              >
                <span className={`absolute left-2 top-6 z-10 h-3 w-3 rounded-full ring-4 ring-white sm:left-[1.05rem] ${transferStatusDotStyle(item.status)}`} />
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Perpindahan Organisasi
                      </p>
                      <div className="mt-2 flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
                        <span className="font-medium text-slate-600">
                          {item.source_organization_name_snapshot || '-'}
                        </span>
                        <ArrowRight className="h-4 w-4 rotate-90 text-red-400 sm:rotate-0" aria-hidden="true" />
                        <span className="font-bold text-slate-800">
                          {item.destination_organization_name_snapshot || '-'}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-bold ${transferStatusStyle(item.status)}`}>
                      {transferStatusLabel(item.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 sm:grid-cols-2">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-red-500" aria-hidden="true" />
                      Efektif {formatDate(item.effective_date)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      Diajukan {formatDateTime(item.submitted_at)}
                    </span>
                  </div>

                  <TransferOutcome item={item} />
                </div>
              </Motion.article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function TransferOutcome({ item }) {
  if (item.status === 'completed') {
    return (
      <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="font-semibold">Perpindahan organisasi telah selesai.</span>
      </div>
    );
  }

  const outcome = getOutcomeReason(item);
  if (!outcome) return null;

  return (
    <div className={`mt-3 rounded-xl border px-3 py-2.5 text-sm ${
      item.status === 'cancelled'
        ? 'border-slate-200 bg-slate-50 text-slate-600'
        : 'border-red-200 bg-red-50 text-red-700'
    }`}>
      <span className="font-bold">{outcome.label}: </span>
      <span>{outcome.reason}</span>
    </div>
  );
}

function getOutcomeReason(item) {
  if (item.status === 'cancelled' && item.cancellation_reason) {
    return { label: 'Alasan pembatalan', reason: item.cancellation_reason };
  }
  if (item.status === 'rejected_destination' && item.destination_review_reason) {
    return { label: 'Alasan penolakan', reason: item.destination_review_reason };
  }
  if (item.status === 'rejected_koni' && item.koni_review_reason) {
    return { label: 'Alasan penolakan', reason: item.koni_review_reason };
  }
  return null;
}

function HistoryState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionPending = false,
  tone = 'neutral',
}) {
  const Icon = icon;
  const iconStyle = tone === 'error'
    ? 'bg-red-50 text-red-600'
    : 'bg-slate-100 text-slate-400';

  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
      <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${iconStyle}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h4 className="font-bold text-slate-800">{title}</h4>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={actionPending}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
        >
          {actionPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-3" aria-label="Memuat riwayat transfer">
      {[0, 1, 2].map((item) => (
        <div key={item} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex justify-between gap-4">
            <div className="space-y-2">
              <div className="h-3 w-28 rounded bg-slate-100" />
              <div className="h-4 w-56 max-w-full rounded bg-slate-200" />
            </div>
            <div className="h-7 w-28 rounded-full bg-slate-100" />
          </div>
          <div className="mt-4 h-11 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function transferStatusDotStyle(status) {
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
