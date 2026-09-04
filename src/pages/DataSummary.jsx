import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  Database,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { DateInput } from '../components/DateInput';
import { SportContingentDistribution } from '../components/data-summary/SportContingentDistribution';
import { PrintDataSummary } from '../components/data-summary/PrintDataSummary';
import { useDataSummary } from '../hooks/queries/useDataAnalysis';
import {
  DEFAULT_TREND_PRESET,
  TREND_GRANULARITY_DAILY,
  TREND_PRESET_OPTIONS,
  buildIntegerTrendScale,
  buildTrendPreset,
  formatTrendDateRange,
  getJakartaToday,
  getSampledTrendLabelIndexes,
  validateTrendDateRange,
} from '../utils/dataSummaryTrend';

const DONUT_COLORS = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#64748b'];

function apiErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || fallback;
}

function number(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

function percentage(value) {
  return `${Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;
}

function knownCategoryCount(items = []) {
  return new Set(
    items
      .filter((item) => item?.key && item.key !== 'unknown')
      .map((item) => String(item.key)),
  ).size;
}

function KpiCard({ label, value, detail, icon, tone = 'red' }) {
  const IconComponent = icon;
  const tones = {
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
          {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
        </div>
        <div className={`rounded-xl p-3 ${tones[tone]}`}>
          <IconComponent className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DonutChart({ title, items = [] }) {
  const total = items.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const lengths = items.map((item) => total > 0 ? (item.count / total) * circumference : 0);
  const offsets = lengths.map((_, index) => lengths.slice(0, index).reduce((sum, length) => sum + length, 0));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-slate-800">{title}</h3>
      <div className="mt-5 grid items-center gap-5 sm:grid-cols-[150px_1fr]">
        <div className="relative mx-auto h-36 w-36">
          <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90" role="img" aria-label={title}>
            <circle cx="55" cy="55" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="14" />
            {items.map((item, index) => {
              const length = lengths[index];
              const circle = (
                <circle
                  key={item.key || item.label}
                  cx="55"
                  cy="55"
                  r={radius}
                  fill="none"
                  stroke={DONUT_COLORS[index % DONUT_COLORS.length]}
                  strokeWidth="14"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offsets[index]}
                  strokeLinecap="butt"
                />
              );
              return circle;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800">{number(total)}</span>
            <span className="text-xs text-slate-400">Total data</span>
          </div>
        </div>
        <div className="space-y-2.5">
          {items.map((item, index) => (
            <div key={item.key || item.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="font-semibold text-slate-800">{number(item.count)} · {percentage(item.percentage)}</span>
            </div>
          ))}
          {!items.length && <p className="text-sm text-slate-400">Belum ada data.</p>}
        </div>
      </div>
    </section>
  );
}

function HorizontalBars({ title, items = [], valueKey = 'count', collapsible = false, previewLimit = 5 }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = collapsible && items.length > previewLimit;
  const visibleItems = hasMore && !expanded ? items.slice(0, previewLimit) : items;
  const maximum = Math.max(1, ...items.map((item) => Number(item[valueKey] || 0)));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-slate-800">{title}</h3>
      <div className="mt-5 space-y-3.5">
        {visibleItems.map((item) => (
          <div key={item.key || item.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-slate-600">{item.label}</span>
              <span className="font-bold text-slate-800">{number(item[valueKey])}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-700"
                style={{ width: `${Math.max(0, Math.min(100, (Number(item[valueKey] || 0) / maximum) * 100))}%` }}
              />
            </div>
          </div>
        ))}
        {!items.length && <p className="text-sm text-slate-400">Belum ada data.</p>}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 border-t border-slate-100 pt-4 text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
        >
          {expanded ? 'Tampilkan lebih sedikit' : `Tampilkan ${items.length - previewLimit} lainnya`}
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </section>
  );
}

function trendValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function trendBucketKey(item, index) {
  return String(item?.date || item?.month || item?.key || item?.label || index);
}

function trendBucketPeriod(item) {
  return item?.label || item?.date || item?.month || '-';
}

function trendBucketDescription(item) {
  const athletes = trendValue(item?.athletes);
  const coaches = trendValue(item?.coaches);
  return `Periode ${trendBucketPeriod(item)}. Atlet ${number(athletes)}. Pelatih ${number(coaches)}. Total ${number(athletes + coaches)}.`;
}

function TrendChart({ items = [], granularity = 'monthly' }) {
  const [hoveredBucketKey, setHoveredBucketKey] = useState(null);
  const [focusedBucketKey, setFocusedBucketKey] = useState(null);
  const [selectedBucketKey, setSelectedBucketKey] = useState(null);
  const [dismissedFocusKey, setDismissedFocusKey] = useState(null);
  const width = 800;
  const height = 240;
  const plotLeft = 64;
  const plotRight = width - 16;
  const plotTop = 14;
  const plotBottom = height - 16;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const unit = granularity === TREND_GRANULARITY_DAILY ? 'hari' : 'bulan';
  const scale = buildIntegerTrendScale(
    items.flatMap((item) => [trendValue(item?.athletes), trendValue(item?.coaches)]),
  );
  const x = (index) => plotLeft + ((index + 0.5) * plotWidth) / Math.max(items.length, 1);
  const y = (value) => plotBottom - (trendValue(value) / scale.maximum) * plotHeight;
  const athletePoints = items.map((item, index) => `${x(index)},${y(item.athletes)}`).join(' ');
  const coachPoints = items.map((item, index) => `${x(index)},${y(item.coaches)}`).join(' ');
  const visibleLabelIndexes = new Set(getSampledTrendLabelIndexes(items.length));
  const activeBucketKey = hoveredBucketKey
    || (focusedBucketKey !== dismissedFocusKey ? focusedBucketKey : null)
    || selectedBucketKey;
  const activeIndex = items.findIndex((item, index) => trendBucketKey(item, index) === activeBucketKey);
  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;
  const activeX = activeItem ? x(activeIndex) : 0;
  const activeY = activeItem ? Math.min(y(activeItem.athletes), y(activeItem.coaches)) : 0;
  const activeDescription = activeItem ? trendBucketDescription(activeItem) : '';
  const tooltipHorizontalTransform = activeX < width * 0.18
    ? 'translateX(0)'
    : activeX > width * 0.82
      ? 'translateX(-100%)'
      : 'translateX(-50%)';
  const tooltipBelowPoint = activeY < plotTop + 112;
  const chartMinimumWidth = Math.max(680, items.length * 48 + 96);
  const plotLeftPercent = (plotLeft / width) * 100;
  const plotRightPercent = ((width - plotRight) / width) * 100;
  const plotTopPercent = (plotTop / height) * 100;
  const plotBottomPercent = ((height - plotBottom) / height) * 100;

  const handleBucketEscape = (event, bucketKey) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    setSelectedBucketKey(null);
    setHoveredBucketKey(null);
    setDismissedFocusKey(bucketKey);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-800">Tren Penambahan Data</h3>
          <p className="text-sm text-slate-400">Jumlah record baru per {unit}. Arahkan atau pilih periode untuk melihat nilainya.</p>
        </div>
        <div className="flex gap-4 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-600" />Atlet</span>
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" />Pelatih</span>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto pb-1">
        <div style={{ minWidth: `${chartMinimumWidth}px` }}>
          <div className="relative h-64">
            {scale.ticks.map((tick) => {
              const tickTop = (y(tick) / height) * 100;
              return (
                <div key={tick} aria-hidden="true">
                  <span
                    className="pointer-events-none absolute -translate-y-1/2 pr-2 text-right text-[10px] font-medium tabular-nums text-slate-400"
                    style={{ left: 0, top: `${tickTop}%`, width: `${plotLeftPercent}%` }}
                  >
                    {number(tick)}
                  </span>
                  <span
                    className="pointer-events-none absolute border-t border-slate-200"
                    style={{ left: `${plotLeftPercent}%`, right: `${plotRightPercent}%`, top: `${tickTop}%` }}
                  />
                </div>
              );
            })}

            <svg
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
              role="img"
              aria-label={`Tren penambahan atlet dan pelatih per ${unit}`}
            >
              {athletePoints && (
                <polyline
                  points={athletePoints}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="4"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {coachPoints && (
                <polyline
                  points={coachPoints}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="4"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
            </svg>

            {activeItem && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute border-l border-dashed border-slate-400"
                style={{
                  left: `${(activeX / width) * 100}%`,
                  top: `${plotTopPercent}%`,
                  bottom: `${plotBottomPercent}%`,
                }}
              />
            )}

            {items.map((item, index) => {
              const bucketKey = trendBucketKey(item, index);
              const athleteValue = trendValue(item?.athletes);
              const coachValue = trendValue(item?.coaches);
              const athleteY = y(athleteValue);
              const coachY = y(coachValue);
              const isActive = bucketKey === activeBucketKey;
              const isStacked = athleteValue === coachValue;
              const athleteSize = isActive ? 14 : isStacked ? 10 : 8;
              const coachSize = isActive ? (isStacked ? 8 : 14) : isStacked ? 5 : 8;

              return (
                <div key={bucketKey} aria-hidden="true">
                  <span
                    className="pointer-events-none absolute rounded-full border-2 border-white bg-red-600 shadow-sm transition-[width,height]"
                    style={{
                      left: `${(x(index) / width) * 100}%`,
                      top: `${(athleteY / height) * 100}%`,
                      width: `${athleteSize}px`,
                      height: `${athleteSize}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                  <span
                    className="pointer-events-none absolute rounded-full border border-white bg-blue-600 shadow-sm transition-[width,height]"
                    style={{
                      left: `${(x(index) / width) * 100}%`,
                      top: `${(coachY / height) * 100}%`,
                      width: `${coachSize}px`,
                      height: `${coachSize}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </div>
              );
            })}

            <div
              className="absolute z-10 grid"
              style={{
                left: `${plotLeftPercent}%`,
                right: `${plotRightPercent}%`,
                top: `${plotTopPercent}%`,
                bottom: `${plotBottomPercent}%`,
                gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
              }}
            >
              {items.map((item, index) => {
                const bucketKey = trendBucketKey(item, index);
                return (
                  <button
                    key={bucketKey}
                    type="button"
                    aria-label={trendBucketDescription(item)}
                    aria-pressed={selectedBucketKey === bucketKey}
                    onPointerEnter={(event) => {
                      if (event.pointerType === 'touch') return;
                      setHoveredBucketKey(bucketKey);
                      setDismissedFocusKey(null);
                    }}
                    onPointerLeave={(event) => {
                      if (event.pointerType !== 'touch') setHoveredBucketKey(null);
                    }}
                    onFocus={() => {
                      setFocusedBucketKey(bucketKey);
                      setDismissedFocusKey(null);
                    }}
                    onBlur={() => {
                      setFocusedBucketKey(null);
                      setDismissedFocusKey(null);
                    }}
                    onClick={() => {
                      setSelectedBucketKey(bucketKey);
                      setDismissedFocusKey(null);
                    }}
                    onKeyDown={(event) => handleBucketEscape(event, bucketKey)}
                    className="min-w-11 touch-pan-x cursor-pointer rounded-sm bg-transparent outline-none focus-visible:bg-slate-900/[0.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400"
                  />
                );
              })}
            </div>

            {activeItem && (
              <div
                role="tooltip"
                className="pointer-events-none absolute z-20 min-w-44 rounded-xl border border-slate-200 bg-slate-900 px-3 py-2.5 text-xs text-white shadow-xl"
                style={{
                  left: `${(activeX / width) * 100}%`,
                  top: `${(activeY / height) * 100}%`,
                  transform: `${tooltipHorizontalTransform} translateY(${tooltipBelowPoint ? '12px' : 'calc(-100% - 12px)'})`,
                }}
              >
                <p className="font-semibold text-white">{trendBucketPeriod(activeItem)}</p>
                <div className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 tabular-nums">
                  <span className="text-slate-300">Atlet</span>
                  <strong className="text-red-300">{number(trendValue(activeItem.athletes))}</strong>
                  <span className="text-slate-300">Pelatih</span>
                  <strong className="text-blue-300">{number(trendValue(activeItem.coaches))}</strong>
                  <span className="border-t border-slate-700 pt-1 font-semibold">Total</span>
                  <strong className="border-t border-slate-700 pt-1">{number(trendValue(activeItem.athletes) + trendValue(activeItem.coaches))}</strong>
                </div>
              </div>
            )}
          </div>

          <div
            className="grid pt-1"
            style={{
              marginLeft: `${plotLeftPercent}%`,
              marginRight: `${plotRightPercent}%`,
              gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {items.map((item, index) => (
              <span key={trendBucketKey(item, index)} className="text-center text-[10px] text-slate-400">
                {visibleLabelIndexes.has(index) ? trendBucketPeriod(item) : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">{activeDescription}</p>
    </section>
  );
}

function DistributionTable({ title, items = [], collapsible = false, previewLimit = 5 }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = collapsible && items.length > previewLimit;
  const visibleItems = hasMore && !expanded ? items.slice(0, previewLimit) : items;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Nama</th>
              <th className="px-5 py-3 text-right">Atlet</th>
              <th className="px-5 py-3 text-right">Pelatih</th>
              <th className="px-5 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleItems.map((item) => (
              <tr key={item.key || item.label}>
                <td className="px-5 py-3.5 font-medium text-slate-700">{item.label}</td>
                <td className="px-5 py-3.5 text-right text-slate-500">{number(item.athletes)}</td>
                <td className="px-5 py-3.5 text-right text-slate-500">{number(item.coaches)}</td>
                <td className="px-5 py-3.5 text-right font-bold text-slate-800">{number(item.count)}</td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan="4" className="px-5 py-8 text-center text-slate-400">Belum ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            className="inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
          >
            {expanded ? 'Tampilkan lebih sedikit' : `Tampilkan ${items.length - previewLimit} lainnya`}
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </section>
  );
}

function QualityPanel({ title, quality }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-800">Kelengkapan {title}</h3>
          <p className="text-sm text-slate-400">Indeks tujuh field inti berbobot sama</p>
        </div>
        <div className="rounded-xl bg-red-50 px-3 py-2 text-lg font-bold text-red-600">
          {percentage(quality?.core_completeness_index)}
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {quality?.completeness?.map((group) => (
          <div key={group.group}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{group.label}</p>
            <div className="space-y-2.5">
              {group.fields.map((field) => (
                <div key={field.field}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600">{field.label}</span>
                    <span className="font-semibold text-slate-700">{percentage(field.percentage)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-red-600" style={{ width: `${field.percentage || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Kepemilikan atribut dan dokumen</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {quality?.ownership?.map((item) => (
            <div key={item.field} className="rounded-xl bg-slate-50 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-bold text-slate-800">{percentage(item.percentage)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{number(item.count)} dari {number(item.total)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LoadingSummary() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-28 rounded-2xl bg-slate-200" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {[1, 2, 3, 4].map((item) => <div key={item} className="h-72 rounded-2xl bg-slate-100" />)}
      </div>
    </div>
  );
}

export function DataSummaryPage() {
  const [organizationId, setOrganizationId] = useState('');
  const [caborId, setCaborId] = useState('');
  const [status, setStatus] = useState('all');
  const [trendState, setTrendState] = useState(() => {
    const applied = buildTrendPreset(DEFAULT_TREND_PRESET);
    return {
      selectedPreset: DEFAULT_TREND_PRESET,
      applied,
      draftStartDate: applied.startDate,
      draftEndDate: applied.endDate,
    };
  });
  const todayJakarta = getJakartaToday();
  const trendValidation = useMemo(() => validateTrendDateRange({
    granularity: trendState.applied.granularity,
    startDate: trendState.draftStartDate,
    endDate: trendState.draftEndDate,
    today: todayJakarta,
  }), [todayJakarta, trendState.applied.granularity, trendState.draftEndDate, trendState.draftStartDate]);
  const filters = useMemo(() => ({
    organizationId,
    caborId,
    status,
    trendGranularity: trendState.applied.granularity,
    trendStartDate: trendState.applied.startDate,
    trendEndDate: trendState.applied.endDate,
    periodMonths: trendState.applied.periodMonths,
  }), [caborId, organizationId, status, trendState.applied]);
  const query = useDataSummary(filters);
  const data = query.data;
  const athletes = data?.overview?.athletes || {};
  const coaches = data?.overview?.coaches || {};
  const totalParentCabors = data?.overview?.total_parent_cabors || 0;
  const totalOrganizations = knownCategoryCount(data?.distributions?.organizations);
  const duplicate = data?.duplicate_summary || {};
  const activeTrendGranularity = data?.filters?.trend_granularity || filters.trendGranularity;
  const trendChartKey = `${filters.trendGranularity}:${filters.trendStartDate}:${filters.trendEndDate}`;
  const customPresetValue = `custom-${trendState.applied.granularity}`;

  const handleTrendPresetChange = (event) => {
    const presetValue = event.target.value;
    if (presetValue.startsWith('custom-')) return;
    const applied = buildTrendPreset(presetValue);
    setTrendState({
      selectedPreset: presetValue,
      applied,
      draftStartDate: applied.startDate,
      draftEndDate: applied.endDate,
    });
  };

  const handleApplyTrendRange = () => {
    if (!trendValidation.isValid || query.isFetching) return;
    setTrendState((current) => {
      const selectedPreset = `custom-${current.applied.granularity}`;
      return {
        ...current,
        selectedPreset,
        applied: {
          ...current.applied,
          preset: selectedPreset,
          startDate: current.draftStartDate,
          endDate: current.draftEndDate,
          periodMonths: trendValidation.monthCount,
          isCustom: true,
        },
      };
    });
  };

  return (
    <DashboardLayout
      title="Summary Data"
      subtitle="Ringkasan agregat atlet, pelatih, distribusi cabor per kontingen, kualitas data, tren, dan indikasi duplikat."
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Filter Laporan</h2>
              <p className="mt-1 text-sm text-slate-400">Seluruh bagian laporan mengikuti scope akses dan filter Data Summary yang aktif.</p>
            </div>
            <PrintDataSummary
              data={data}
              filters={filters}
              totalOrganizations={totalOrganizations}
              disabled={!data || query.isError || query.isFetching}
              isFetching={query.isFetching}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-500">Organisasi</span>
              <select
                value={organizationId}
                onChange={(event) => setOrganizationId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="">Semua organisasi</option>
                {data?.filter_options?.organizations?.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-500">Cabang olahraga</span>
              <select
                value={caborId}
                onChange={(event) => setCaborId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="">Semua cabor</option>
                {data?.filter_options?.cabors?.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-500">Status data</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="all">Aktif dan tidak aktif</option>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak aktif</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-500">Granularitas dan periode tren</span>
              <select
                value={trendState.selectedPreset}
                onChange={handleTrendPresetChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                {TREND_PRESET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
                {trendState.applied.isCustom && (
                  <option value={customPresetValue}>
                    {trendState.applied.granularity === TREND_GRANULARITY_DAILY ? 'Harian' : 'Bulanan'} — Rentang kustom
                  </option>
                )}
              </select>
            </label>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">Tanggal mulai tren</span>
                <DateInput
                  value={trendState.draftStartDate}
                  max={todayJakarta}
                  onChange={(event) => setTrendState((current) => ({ ...current, draftStartDate: event.target.value }))}
                  aria-invalid={!trendValidation.isValid}
                  aria-describedby="trend-date-validation"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">Tanggal akhir tren</span>
                <DateInput
                  value={trendState.draftEndDate}
                  max={todayJakarta}
                  onChange={(event) => setTrendState((current) => ({ ...current, draftEndDate: event.target.value }))}
                  aria-invalid={!trendValidation.isValid}
                  aria-describedby="trend-date-validation"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </label>
              <button
                type="button"
                onClick={handleApplyTrendRange}
                disabled={!trendValidation.isValid || query.isFetching}
                aria-describedby="trend-date-validation"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {query.isFetching && <RefreshCw className="h-4 w-4 animate-spin" />}
                {query.isFetching ? 'Memuat tren...' : 'Terapkan Rentang'}
              </button>
            </div>
            <div id="trend-date-validation" className="mt-2 flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
              {trendValidation.isValid ? (
                <p className="text-slate-500">
                  {trendState.applied.granularity === TREND_GRANULARITY_DAILY
                    ? `${trendValidation.dayCount} tanggal harian`
                    : `${trendValidation.monthCount} bucket bulanan`}
                  {' · '}{formatTrendDateRange(trendState.draftStartDate, trendState.draftEndDate)}
                </p>
              ) : (
                <p role="alert" className="font-medium text-red-600">{trendValidation.error}</p>
              )}
              <p className="text-slate-400">Perubahan tanggal diterapkan setelah tombol ditekan.</p>
            </div>
          </div>
        </section>

        {query.isLoading ? (
          <LoadingSummary />
        ) : query.isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
            <h2 className="mt-3 font-bold text-red-800">Summary gagal dimuat</h2>
            <p className="mt-1 text-sm text-red-600">{apiErrorMessage(query.error, 'Terjadi kesalahan saat memuat summary.')}</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              <KpiCard label="Total atlet" value={number(athletes.total)} detail={`${number(athletes.active)} aktif · ${number(athletes.inactive)} tidak aktif`} icon={Users} tone="red" />
              <KpiCard label="Total pelatih" value={number(coaches.total)} detail={`${number(coaches.active)} aktif · ${number(coaches.inactive)} tidak aktif`} icon={UserCheck} tone="blue" />
              <KpiCard label="Total Cabor Induk" value={number(totalParentCabors)} detail="Mengikuti scope akses dan filter aktif" icon={Trophy} tone="amber" />
              <KpiCard label="Total Organisasi" value={number(totalOrganizations)} detail="Berdasarkan hasil filter saat ini" icon={Building2} tone="violet" />
              <KpiCard label="Akun terhubung" value={number((athletes.linked_users || 0) + (coaches.linked_users || 0))} detail={`Atlet ${number(athletes.linked_users)} · Pelatih ${number(coaches.linked_users)}`} icon={ShieldCheck} tone="emerald" />
              <KpiCard label="Rata-rata umur" value={`${athletes.average_age || 0} / ${coaches.average_age || 0}`} detail="Atlet / Pelatih (tahun)" icon={TrendingUp} tone="amber" />
          </div>
        )}

        {!query.isLoading && !query.isError && (
          <SportContingentDistribution data={data?.sport_contingent_distribution} />
        )}

        {!query.isLoading && !query.isError && (
          <>
            <div className="grid gap-6 xl:grid-cols-2">
              <TrendChart key={trendChartKey} items={data?.trends} granularity={activeTrendGranularity} />
              <DonutChart title="Gender Atlet" items={data?.distributions?.athlete_gender} />
              <DonutChart title="Gender Pelatih" items={data?.distributions?.coach_gender} />
              <HorizontalBars title="Kelompok Umur Atlet" items={data?.distributions?.athlete_age_groups} />
              <HorizontalBars title="Kelompok Umur Pelatih" items={data?.distributions?.coach_age_groups} />
              <HorizontalBars title="Cluster Atlet" items={data?.distributions?.athlete_clusters} collapsible />
              <HorizontalBars title="Cluster Pelatih" items={data?.distributions?.coach_clusters} collapsible />
              <HorizontalBars title="Level Lisensi Pelatih" items={data?.distributions?.coach_license_levels} collapsible />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <DistributionTable title="Distribusi Cabang Olahraga" items={data?.distributions?.cabors} collapsible />
              <DistributionTable title="Distribusi Organisasi" items={data?.distributions?.organizations} collapsible />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <QualityPanel title="Atlet" quality={data?.data_quality?.athletes} />
              <QualityPanel title="Pelatih" quality={data?.data_quality?.coaches} />
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-50 p-3 text-violet-600"><Database className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-bold text-slate-800">Ringkasan Analisis Duplikat</h3>
                  <p className="text-sm text-slate-400">Agregat kandidat dalam scope dan filter summary saat ini</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Confidence tinggi', value: duplicate.high, tone: 'text-red-600 bg-red-50' },
                  { label: 'Suspek', value: duplicate.suspect, tone: 'text-amber-600 bg-amber-50' },
                  { label: 'Belum direview', value: duplicate.unreviewed, tone: 'text-blue-600 bg-blue-50' },
                  { label: 'Perlu review', value: duplicate.needs_review, tone: 'text-violet-600 bg-violet-50' },
                  { label: 'Duplikat terkonfirmasi', value: duplicate.confirmed_duplicates, tone: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Orang berbeda', value: duplicate.different_person, tone: 'text-slate-600 bg-slate-100' },
                  { label: 'Indikasi peran ganda', value: duplicate.dual_role_indications, tone: 'text-cyan-600 bg-cyan-50' },
                  { label: 'Peran ganda terkonfirmasi', value: duplicate.confirmed_dual_roles, tone: 'text-teal-600 bg-teal-50' },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl p-4 ${item.tone}`}>
                    <p className="text-xs font-semibold">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold">{number(item.value)}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
              <span>SatuData hanya berisi agregat; distribusi cabor menampilkan nama kontingen tanpa NIK atau identitas individu.</span>
              {data?.generated_at && <span>Diperbarui {new Date(data.generated_at).toLocaleString('id-ID')}</span>}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
