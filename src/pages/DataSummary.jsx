import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
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
import { PrintDataSummary } from '../components/data-summary/PrintDataSummary';
import { useDataSummary } from '../hooks/queries/useDataAnalysis';

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

function TrendChart({ items = [] }) {
  const width = 800;
  const height = 240;
  const padding = 28;
  const maximum = Math.max(1, ...items.flatMap((item) => [Number(item.athletes || 0), Number(item.coaches || 0)]));
  const x = (index) => items.length <= 1 ? width / 2 : padding + (index * (width - padding * 2)) / (items.length - 1);
  const y = (value) => height - padding - (Number(value || 0) / maximum) * (height - padding * 2);
  const athletePoints = items.map((item, index) => `${x(index)},${y(item.athletes)}`).join(' ');
  const coachPoints = items.map((item, index) => `${x(index)},${y(item.coaches)}`).join(' ');

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-800">Tren Penambahan Data</h3>
          <p className="text-sm text-slate-400">Jumlah record baru per bulan</p>
        </div>
        <div className="flex gap-4 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-600" />Atlet</span>
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" />Pelatih</span>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[680px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label="Tren penambahan atlet dan pelatih">
            {[0, 1, 2, 3, 4].map((line) => {
              const lineY = padding + (line * (height - padding * 2)) / 4;
              return <line key={line} x1={padding} x2={width - padding} y1={lineY} y2={lineY} stroke="#e2e8f0" strokeWidth="1" />;
            })}
            {athletePoints && <polyline points={athletePoints} fill="none" stroke="#dc2626" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />}
            {coachPoints && <polyline points={coachPoints} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />}
            {items.map((item, index) => (
              <g key={item.month}>
                <circle cx={x(index)} cy={y(item.athletes)} r="4" fill="#dc2626" />
                <circle cx={x(index)} cy={y(item.coaches)} r="4" fill="#2563eb" />
              </g>
            ))}
          </svg>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }}>
            {items.map((item, index) => (
              <span key={item.month} className={`text-center text-[10px] text-slate-400 ${items.length > 12 && index % 2 === 1 ? 'opacity-0' : ''}`}>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
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
  const [periodMonths, setPeriodMonths] = useState(12);
  const filters = useMemo(() => ({ organizationId, caborId, status, periodMonths }), [organizationId, caborId, status, periodMonths]);
  const query = useDataSummary(filters);
  const data = query.data;
  const athletes = data?.overview?.athletes || {};
  const coaches = data?.overview?.coaches || {};
  const totalCabors = knownCategoryCount(data?.distributions?.cabors);
  const totalOrganizations = knownCategoryCount(data?.distributions?.organizations);
  const duplicate = data?.duplicate_summary || {};

  return (
    <DashboardLayout
      title="Summary Data"
      subtitle="Ringkasan agregat atlet, pelatih, kualitas data, tren, dan indikasi duplikat."
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Filter Laporan</h2>
              <p className="mt-1 text-sm text-slate-400">Laporan cetak mengikuti scope akses dan filter aktif.</p>
            </div>
            <PrintDataSummary
              data={data}
              filters={filters}
              totalCabors={totalCabors}
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
              <span className="mb-1.5 block text-xs font-semibold text-slate-500">Periode tren</span>
              <select
                value={periodMonths}
                onChange={(event) => setPeriodMonths(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value={6}>6 bulan</option>
                <option value={12}>12 bulan</option>
                <option value={24}>24 bulan</option>
              </select>
            </label>
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
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              <KpiCard label="Total atlet" value={number(athletes.total)} detail={`${number(athletes.active)} aktif · ${number(athletes.inactive)} tidak aktif`} icon={Users} tone="red" />
              <KpiCard label="Total pelatih" value={number(coaches.total)} detail={`${number(coaches.active)} aktif · ${number(coaches.inactive)} tidak aktif`} icon={UserCheck} tone="blue" />
              <KpiCard label="Total Cabor" value={number(totalCabors)} detail="Berdasarkan hasil filter saat ini" icon={Trophy} tone="amber" />
              <KpiCard label="Total Organisasi" value={number(totalOrganizations)} detail="Berdasarkan hasil filter saat ini" icon={Building2} tone="violet" />
              <KpiCard label="Akun terhubung" value={number((athletes.linked_users || 0) + (coaches.linked_users || 0))} detail={`Atlet ${number(athletes.linked_users)} · Pelatih ${number(coaches.linked_users)}`} icon={ShieldCheck} tone="emerald" />
              <KpiCard label="Rata-rata umur" value={`${athletes.average_age || 0} / ${coaches.average_age || 0}`} detail="Atlet / Pelatih (tahun)" icon={TrendingUp} tone="amber" />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <TrendChart items={data?.trends} />
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
              <span>Summary hanya berisi agregat dan tidak mengirim identitas atau NIK individu.</span>
              {data?.generated_at && <span>Diperbarui {new Date(data.generated_at).toLocaleString('id-ID')}</span>}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
