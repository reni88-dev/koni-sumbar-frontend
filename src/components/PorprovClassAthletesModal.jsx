import { useEffect, useId, useMemo, useRef } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { Building2, ShieldCheck, UserRound, Users, X } from 'lucide-react';

const verificationLabels = {
  draft: 'Belum Diajukan',
  pending: 'Menunggu Pemeriksaan',
  submitted: 'Menunggu Pemeriksaan',
  verified_by_contingent: 'Disahkan Kontingen',
  rejected_by_contingent: 'Ditolak Kontingen',
  approved: 'Lolos Pemeriksaan',
  appeal_approved: 'Banding Disetujui',
  revision_required: 'Perlu Revisi',
  rejected: 'Ditolak',
  under_appeal: 'Dalam Banding',
  appeal_rejected: 'Banding Ditolak',
  finalized: 'Pengesahan Selesai',
};

const verificationStyles = {
  draft: 'bg-slate-100 text-slate-600',
  pending: 'border border-amber-200 bg-amber-50 text-amber-700',
  submitted: 'border border-blue-200 bg-blue-50 text-blue-700',
  verified_by_contingent: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected_by_contingent: 'border border-red-200 bg-red-50 text-red-700',
  approved: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  appeal_approved: 'border border-indigo-200 bg-indigo-50 text-indigo-700',
  revision_required: 'border border-amber-200 bg-amber-50 text-amber-700',
  rejected: 'border border-red-200 bg-red-50 text-red-700',
  under_appeal: 'border border-amber-200 bg-amber-50 text-amber-700',
  appeal_rejected: 'border border-red-200 bg-red-50 text-red-700',
  finalized: 'border border-green-200 bg-green-100 text-green-800',
};

function humanize(value) {
  if (!value) return '-';
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function participantTypePresentation(type) {
  const key = String(type || '').toLowerCase();
  if (key === 'reserve') {
    return { label: 'Cadangan', style: 'border border-amber-200 bg-amber-50 text-amber-700' };
  }
  if (key === 'main') {
    return { label: 'Utama', style: 'border border-blue-200 bg-blue-50 text-blue-700' };
  }
  return { label: humanize(key), style: 'border border-slate-200 bg-slate-50 text-slate-600' };
}

function verificationPresentation(status) {
  const key = String(status || '').toLowerCase();
  return {
    label: verificationLabels[key] || humanize(key),
    style: verificationStyles[key] || 'border border-slate-200 bg-slate-50 text-slate-600',
  };
}

function athleteName(athlete) {
  return athlete?.athlete_name_snapshot || `Atlet #${athlete?.athlete_id || athlete?.id || '-'}`;
}

export function PorprovClassAthletesModal({
  isOpen,
  onClose,
  event,
  competitionClass,
  athletes,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const sortedAthletes = useMemo(() => (
    [...(Array.isArray(athletes) ? athletes : [])].sort((left, right) => (
      athleteName(left).localeCompare(athleteName(right), 'id-ID', { sensitivity: 'base' })
    ))
  ), [athletes]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 0);
    const handleKeyDown = (keyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose?.();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isOpen, onClose]);

  const eventLabel = event?.name
    ? `${event.name}${event.year ? ` (${event.year})` : ''}`
    : 'Event Porprov';
  const classLabel = competitionClass?.name || 'Kelas pertandingan';

  return (
    <AnimatePresence>
      {isOpen && competitionClass && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" role="presentation">
          <Motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Tutup daftar atlet Porprov"
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
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 sm:h-12 sm:w-12">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id={titleId} className="text-lg font-bold text-slate-900 sm:text-xl">Atlet Porprov</h2>
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                    {sortedAthletes.length} atlet
                  </span>
                </div>
                <p id={descriptionId} className="mt-1 break-words text-sm font-semibold text-slate-700">
                  {eventLabel}
                </p>
                <p className="mt-0.5 break-words text-xs text-slate-500">
                  {classLabel}{competitionClass.code ? ` · ${competitionClass.code}` : ''}
                </p>
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
              {sortedAthletes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                  <Users className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada atlet pada kelas ini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_9rem_12rem] gap-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 sm:grid">
                    <span>Nama Atlet</span>
                    <span>Kontingen</span>
                    <span>Tipe</span>
                    <span>Status Verifikasi</span>
                  </div>
                  {sortedAthletes.map((athlete) => {
                    const participantType = participantTypePresentation(athlete.participant_type);
                    const verification = verificationPresentation(athlete.verification_status);

                    return (
                      <article
                        key={athlete.id || `${athlete.athlete_id}-${athlete.competition_class_id}`}
                        className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_9rem_12rem] sm:items-center sm:gap-4"
                      >
                        <div className="min-w-0">
                          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">Nama Atlet</span>
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                              <UserRound className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <p className="min-w-0 break-words text-sm font-bold text-slate-800">{athleteName(athlete)}</p>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">Kontingen</span>
                          <div className="flex min-w-0 items-start gap-2 text-sm text-slate-600">
                            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                            <span className="break-words">{athlete.contingent_name_snapshot || '-'}</span>
                          </div>
                        </div>
                        <div>
                          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">Tipe</span>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${participantType.style}`}>
                            {participantType.label}
                          </span>
                        </div>
                        <div>
                          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">Status Verifikasi</span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${verification.style}`}>
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            {verification.label}
                          </span>
                        </div>
                      </article>
                    );
                  })}
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
