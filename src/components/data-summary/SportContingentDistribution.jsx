import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, MapPinned, Trophy } from 'lucide-react';
import {
  SPORT_GROUP_ALL,
  SPORT_GROUP_LARGE,
  SPORT_GROUP_SMALL,
  buildSportContingentDistributionView,
} from '../../utils/sportContingentDistribution';

const GROUP_OPTIONS = [
  { value: SPORT_GROUP_ALL, label: 'Semua cabor' },
  { value: SPORT_GROUP_LARGE, label: 'Cabor Besar' },
  { value: SPORT_GROUP_SMALL, label: 'Cabor Kecil' },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

function sportName(sport) {
  const name = sport?.cabor_name || `Cabor #${sport?.cabor_id || '-'}`;
  const federationCode = String(sport?.federation_code || '').trim();
  return federationCode ? `${name} (${federationCode})` : name;
}

function GroupBadge({ group }) {
  const large = group === SPORT_GROUP_LARGE;
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
      large
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-amber-200 bg-amber-50 text-amber-700'
    }`}>
      {large ? 'Cabor Besar' : 'Cabor Kecil'}
    </span>
  );
}

function GroupSummaryCard({ label, value, detail, tone, icon }) {
  const IconComponent = icon;
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };
  return (
    <article className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</p>
          <p className="mt-1 text-3xl font-extrabold">{formatNumber(value)}</p>
          <p className="mt-1 text-xs opacity-75">{detail}</p>
        </div>
        <span className="rounded-xl bg-white/70 p-2.5" aria-hidden="true">
          <IconComponent className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

export function SportContingentDistribution({ data }) {
  const [group, setGroup] = useState(SPORT_GROUP_ALL);
  const [showAllSports, setShowAllSports] = useState(false);
  const [expandedSports, setExpandedSports] = useState(() => new Set());
  const sports = useMemo(() => data?.sports || [], [data?.sports]);
  const distributionView = useMemo(
    () => buildSportContingentDistributionView(sports, { group, expanded: showAllSports }),
    [group, showAllSports, sports],
  );
  const { visibleSports, hiddenCount, hasOverflow } = distributionView;
  const threshold = Number(data?.threshold || 10);

  const handleGroupChange = (event) => {
    setGroup(event.target.value);
    setShowAllSports(false);
  };

  const toggleSport = (caborId) => {
    setExpandedSports((current) => {
      const next = new Set(current);
      if (next.has(caborId)) next.delete(caborId);
      else next.add(caborId);
      return next;
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="sport-contingent-title">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-red-50 p-3 text-red-600" aria-hidden="true">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <h2 id="sport-contingent-title" className="font-bold text-slate-800">Kelompok Cabor berdasarkan Kontingen</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Cabor Besar memiliki minimal {formatNumber(threshold)} kontingen kab/kota. Cabor Kecil memiliki maksimal{' '}
                {formatNumber(Math.max(0, threshold - 1))} kontingen. Perhitungan hanya memakai atlet SatuData dari organisasi pengkab dan pengkot sesuai filter aktif.
              </p>
            </div>
          </div>
          <label className="block w-full sm:w-56">
            <span className="mb-1.5 block text-xs font-semibold text-slate-500">Tampilkan kelompok</span>
            <select
              value={group}
              onChange={handleGroupChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              {GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <GroupSummaryCard
            label="Total Cabor Besar"
            value={data?.large_count}
            detail={`Minimal ${formatNumber(threshold)} kontingen kab/kota`}
            tone="emerald"
            icon={MapPinned}
          />
          <GroupSummaryCard
            label="Total Cabor Kecil"
            value={data?.small_count}
            detail={`Maksimal ${formatNumber(Math.max(0, threshold - 1))} kontingen kab/kota`}
            tone="amber"
            icon={Trophy}
          />
        </div>
      </div>

      {!sports.length ? (
        <div className="p-8 text-center sm:p-10">
          <MapPinned className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <h3 className="mt-3 font-bold text-slate-700">Distribusi kontingen belum tersedia</h3>
          <p className="mt-1 text-sm text-slate-500">
            Tidak ada atlet dari organisasi pengkab atau pengkot pada scope dan filter Data Summary saat ini.
          </p>
        </div>
      ) : !visibleSports.length ? (
        <div className="p-8 text-center text-sm text-slate-500">
          Tidak ada distribusi cabor untuk kelompok yang dipilih.
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-20 px-4 py-3 text-center font-bold sm:px-5">No.</th>
                  <th className="px-4 py-3 font-bold sm:px-5">Cabang Olahraga</th>
                  <th className="w-44 px-4 py-3 text-center font-bold sm:px-5">Kontingen Kab/Kota</th>
                  <th className="w-36 px-4 py-3 text-center font-bold sm:px-5">Jumlah Atlet</th>
                  <th className="w-40 px-4 py-3 text-center font-bold sm:px-5">Kelompok</th>
                </tr>
              </thead>
              <tbody id="sport-contingent-rows" className="divide-y divide-slate-100">
                {visibleSports.map((sport) => {
                  const expansionKey = Number(sport.cabor_id);
                  const expanded = expandedSports.has(expansionKey);
                  const detailId = `sport-contingents-${expansionKey}`;
                  return (
                    <Fragment key={sport.cabor_id}>
                      <tr className="align-middle transition-colors hover:bg-slate-50/70">
                        <td className="px-4 py-4 text-center font-bold text-slate-500 sm:px-5">{formatNumber(sport.rank)}</td>
                        <td className="px-4 py-4 sm:px-5">
                          <button
                            type="button"
                            onClick={() => toggleSport(expansionKey)}
                            aria-expanded={expanded}
                            aria-controls={detailId}
                            aria-label={`${expanded ? 'Tutup' : 'Buka'} rincian kontingen ${sportName(sport)}`}
                            className="group inline-flex max-w-full items-center gap-2 rounded-lg text-left font-bold text-slate-800 outline-none hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                          >
                            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:text-red-500 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                            <span>{sportName(sport)}</span>
                          </button>
                        </td>
                        <td className="px-4 py-4 text-center text-lg font-extrabold text-slate-800 sm:px-5">{formatNumber(sport.contingent_count)}</td>
                        <td className="px-4 py-4 text-center font-bold text-slate-700 sm:px-5">{formatNumber(sport.athlete_count)}</td>
                        <td className="px-4 py-4 text-center sm:px-5"><GroupBadge group={sport.group} /></td>
                      </tr>
                      <tr id={detailId} hidden={!expanded} className="bg-slate-50/80">
                        <td colSpan={5} className="px-4 py-4 sm:px-5">
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <h3 className="text-sm font-bold text-slate-800">Rincian kontingen kab/kota</h3>
                              <p className="text-xs text-slate-500">
                                {formatNumber(sport.contingent_count)} kontingen · {formatNumber(sport.athlete_count)} atlet
                              </p>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              {(sport.contingents || []).map((contingent) => (
                                <div key={contingent.organization_id} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                                  <span className="min-w-0 font-medium text-slate-700">{contingent.name}</span>
                                  <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600 shadow-sm">
                                    {formatNumber(contingent.athlete_count)} atlet
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasOverflow && (
            <div className="border-t border-slate-100 px-4 py-4 text-center sm:px-5">
              <button
                type="button"
                onClick={() => setShowAllSports((current) => !current)}
                aria-expanded={showAllSports}
                aria-controls="sport-contingent-rows"
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                <span>
                  {showAllSports ? 'Tampilkan lebih sedikit' : `Tampilkan ${formatNumber(hiddenCount)} lainnya`}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showAllSports ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
