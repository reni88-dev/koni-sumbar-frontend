import { AlertCircle, Loader2, MapPin, Medal, RefreshCw, Trophy } from 'lucide-react';

const MEDALS = {
  gold: { label: 'Emas', className: 'bg-amber-100 text-amber-800 ring-amber-200' },
  silver: { label: 'Perak', className: 'bg-slate-100 text-slate-700 ring-slate-300' },
  bronze: { label: 'Perunggu', className: 'bg-orange-100 text-orange-800 ring-orange-200' },
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

function MedalBadge({ medal }) {
  const config = MEDALS[medal];
  if (!config) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${config.className}`}>
      <Medal className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}

function EventCard({ event }) {
  const achievements = event.achievements || [];
  const registrations = event.registrations || [];
  const counts = achievements.reduce((acc, item) => ({ ...acc, [item.medal]: (acc[item.medal] || 0) + 1 }), {});
  const period = [formatDate(event.start_date), formatDate(event.end_date)].filter(Boolean).join(' - ');

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-800">{event.event_name}</h4>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
            {event.contingent_name && <span>Kontingen {event.contingent_name}</span>}
            {event.host_location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{event.host_location}</span>}
            {period && <span>{period}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(MEDALS).filter((key) => counts[key]).map((key) => (
            <span key={key} className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${MEDALS[key].className}`}>{counts[key]} {MEDALS[key].label}</span>
          ))}
        </div>
      </div>

      {registrations.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Nomor yang diikuti</p>
          <ul className="space-y-0.5 text-sm text-slate-700">
            {registrations.map((item, index) => (
              <li key={`${item.cabor_name}-${item.class_name}-${index}`}>{item.cabor_name}{item.class_name ? ` — ${item.class_name}` : ''}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Prestasi</p>
        {achievements.length === 0 ? (
          <p className="text-sm text-slate-500">{event.results_published ? 'Tidak ada medali pada event ini.' : 'Hasil event belum dipublikasikan.'}</p>
        ) : (
          <ul className="space-y-1.5">
            {achievements.map((item, index) => (
              <li key={`${item.cabor_name}-${item.class_name}-${item.medal}-${index}`} className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                <MedalBadge medal={item.medal} />
                <span>{item.cabor_name}{item.class_name ? ` — ${item.class_name}` : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Presentational list of Sirimau events and medals; `query` is the TanStack Query result of the hook. */
export function PorprovAchievementsPanel({ query }) {
  const events = query.data?.data || [];

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Trophy className="h-4 w-4 text-amber-500" />Event Sirimau &amp; Prestasi
      </h3>
      {query.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Memuat data event Sirimau...</p>
      ) : query.isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <p className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />Data event Sirimau belum dapat dimuat.</p>
          <button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? 'animate-spin' : ''}`} />Coba Lagi
          </button>
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-slate-500">Atlet ini belum tercatat mengikuti event Sirimau.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => <EventCard key={event.event_id} event={event} />)}
        </div>
      )}
    </div>
  );
}
