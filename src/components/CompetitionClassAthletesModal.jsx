import { useEffect, useId, useMemo, useRef } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { Building2, Medal, RefreshCw, UserRound, Users, X } from 'lucide-react';

function athleteOrganization(athlete) {
  return athlete?.organization?.name || athlete?.organization_name || '-';
}

function athleteCabor(athlete) {
  return athlete?.cabor?.display_name || athlete?.cabor?.name || athlete?.cabor_name || '-';
}

function errorMessage(error) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || 'Daftar atlet master gagal dimuat. Coba kembali.';
}

export function CompetitionClassAthletesModal({
  isOpen,
  onClose,
  competitionClass,
  athletes,
  isLoading = false,
  isError = false,
  error,
  onRetry,
}) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  const sortedAthletes = useMemo(() => (
    [...(Array.isArray(athletes) ? athletes : [])].sort((left, right) => (
      String(left?.name || '').localeCompare(String(right?.name || ''), 'id-ID', { sensitivity: 'base' })
    ))
  ), [athletes]);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 0);
    const handleKeyDown = (keyboardEvent) => {
      if (keyboardEvent.key === 'Escape') closeRef.current?.();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isOpen]);

  const className = competitionClass?.name || 'Kelas pertandingan';
  const caborName = competitionClass?.cabor?.display_name || competitionClass?.cabor?.name || '-';

  return (
    <AnimatePresence>
      {isOpen && competitionClass && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" role="presentation">
          <Motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Tutup daftar atlet master"
            className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <Motion.section
            ref={dialogRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)]"
          >
            <div className="flex items-start gap-3 border-b border-slate-100 p-4 sm:gap-4 sm:p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:h-12 sm:w-12">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id={titleId} className="text-lg font-bold text-slate-900 sm:text-xl">Atlet Master</h2>
                  {!isLoading && !isError && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {sortedAthletes.length} atlet
                    </span>
                  )}
                </div>
                <p id={descriptionId} className="mt-1 break-words text-sm font-semibold text-slate-700">
                  {className}{competitionClass.code ? ` · ${competitionClass.code}` : ''}
                </p>
                <p className="mt-0.5 break-words text-xs text-slate-500">{caborName}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup modal"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/60 p-3 sm:p-6">
              {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
                  <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-slate-600">Memuat daftar atlet master...</p>
                </div>
              ) : isError ? (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-red-700">{errorMessage(error)}</p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Coba lagi
                  </button>
                </div>
              ) : sortedAthletes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                  <Users className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">Tidak ada atlet dalam scope akses Anda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_10rem_7rem] gap-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 sm:grid">
                    <span>Nama Atlet</span>
                    <span>Organisasi</span>
                    <span>No. Atlet Nasional</span>
                    <span>Status</span>
                  </div>
                  {sortedAthletes.map((athlete) => (
                    <article
                      key={athlete.id}
                      className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_10rem_7rem] sm:items-center sm:gap-4"
                    >
                      <div className="min-w-0">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">Nama Atlet</span>
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                            <UserRound className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="break-words text-sm font-bold text-slate-800">{athlete.name || `Atlet #${athlete.id}`}</p>
                            <p className="mt-0.5 break-words text-xs text-slate-400">{athleteCabor(athlete)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">Organisasi</span>
                        <div className="flex min-w-0 items-start gap-2 text-sm text-slate-600">
                          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                          <span className="break-words">{athleteOrganization(athlete)}</span>
                        </div>
                      </div>
                      <div>
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">No. Atlet Nasional</span>
                        <span className="break-all font-mono text-sm text-slate-600">{athlete.national_athlete_number || '-'}</span>
                      </div>
                      <div>
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">Status</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          athlete.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Medal className="h-3.5 w-3.5" aria-hidden="true" />
                          {athlete.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-white p-4 sm:flex sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
              >
                Tutup
              </button>
            </div>
          </Motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
