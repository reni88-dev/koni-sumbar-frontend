import { createElement, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileWarning,
  ShieldAlert,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  formatQualityDate,
  formatQualityDateTime,
  formatQualityNumber,
  formatQualityScore,
  parseQualityJSON,
  qualityLabel,
  qualityTone,
} from '../../features/data-quality-report/formatters.js';
import { buildQualitySearchParams } from '../../features/data-quality-report/queryParams.js';
import { getQualityReportByKey } from '../../features/data-quality-report/reportConfig.js';

function Badge({ value, label }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${qualityTone(value)}`}>{label || qualityLabel(value)}</span>;
}

function MetricCard({ icon, label, value, helper, to, tone = 'text-red-600 bg-red-50' }) {
  const content = (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-red-100">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>{createElement(icon, { className: 'h-5 w-5' })}</div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
    </div>
  );
  return to ? <Link to={to} className="block h-full focus:outline-none focus:ring-2 focus:ring-red-300">{content}</Link> : content;
}

function buildReportLink(reportKey, filters, extra = {}) {
  const report = getQualityReportByKey(reportKey);
  if (!report) return null;
  const params = buildQualitySearchParams(reportKey, {
    region_ids: filters.region_ids,
    organization_ids: filters.organization_ids,
    federation_ids: filters.federation_ids,
    cabor_ids: filters.cabor_ids,
    pengcab_ids: filters.pengcab_ids,
    as_of_date: filters.as_of_date,
    ...extra,
  }, { resetPage: true });
  const search = params.toString();
  return search ? `${report.path}?${search}` : report.path;
}

function SummaryReport({ response, filters, allowedReportKeys }) {
  const data = response.data || {};
  const athlete = data.by_profile_type?.athlete || {};
  const coach = data.by_profile_type?.coach || {};
  const canAthletes = allowedReportKeys.includes('athletes');
  const canCoaches = allowedReportKeys.includes('coaches');
  const canDistribution = allowedReportKeys.includes('distribution');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Total profil" value={formatQualityNumber(data.profiles_total)} helper="Atlet dan pelatih dalam scope" />
        <MetricCard icon={TrendingUp} label="Skor rata-rata" value={`${formatQualityScore(data.average_score)}%`} tone="bg-blue-50 text-blue-600" />
        <MetricCard icon={FileWarning} label="Finding aktif" value={formatQualityNumber(data.active_finding_count)} tone="bg-amber-50 text-amber-600" />
        <MetricCard icon={ShieldAlert} label="Prioritas kritis" value={formatQualityNumber(data.critical_count)} tone="bg-red-50 text-red-600" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-800">Profil menurut jenis</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard icon={UserCheck} label="Atlet" value={formatQualityNumber(athlete.total)} helper={`Skor ${formatQualityScore(athlete.average_score)}% · ${formatQualityNumber(athlete.issues)} masalah`} to={canAthletes ? buildReportLink('athletes', filters) : null} tone="bg-blue-50 text-blue-600" />
          <MetricCard icon={Users} label="Pelatih" value={formatQualityNumber(coach.total)} helper={`Skor ${formatQualityScore(coach.average_score)}% · ${formatQualityNumber(coach.issues)} masalah`} to={canCoaches ? buildReportLink('coaches', filters) : null} tone="bg-violet-50 text-violet-600" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">Kategori kelengkapan</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(data.by_category || {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><Badge value={key} /><strong className="text-slate-800">{formatQualityNumber(value)}</strong></div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">Temuan menurut prioritas</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(data.by_priority || {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><Badge value={key} /><strong className="text-slate-800">{formatQualityNumber(value)}</strong></div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">Temuan menurut jenis</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data.by_finding_type || {}).map(([key, value]) => {
            const targetKey = ['certain_duplicate', 'identity_conflict', 'possible_duplicate', 'shared_contact'].includes(key)
              ? 'duplicates'
              : ['invalid_nik', 'invalid_kk', 'invalid_phone', 'invalid_email'].includes(key)
                ? 'validity'
                : null;
            const to = targetKey && allowedReportKeys.includes(targetKey)
              ? buildReportLink(targetKey, filters, { finding_type: key })
              : null;
            const card = <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-sm font-medium text-slate-600">{qualityLabel(key)}</p><p className="mt-1 text-xl font-bold text-slate-900">{formatQualityNumber(value)}</p></div>;
            return to ? <Link key={key} to={to} className="rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300">{card}</Link> : <div key={key}>{card}</div>;
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-800">Tren snapshot</h2></div>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Profil</th><th className="px-4 py-3 text-right">Skor</th><th className="px-4 py-3 text-right">Jumlah</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{(data.trend || []).map((item, index) => <tr key={`${item.date}-${item.profile_type}-${index}`}><td className="px-4 py-3">{formatQualityDate(item.date)}</td><td className="px-4 py-3">{qualityLabel(item.profile_type)}</td><td className="px-4 py-3 text-right font-semibold">{formatQualityScore(item.average_score)}%</td><td className="px-4 py-3 text-right">{formatQualityNumber(item.profiles)}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-800">Peringkat kualitas</h2></div>
          <div className="max-h-96 overflow-auto divide-y divide-slate-100">
            {(data.rankings || []).map((item, index) => {
              const to = canDistribution && (item.organization_id || item.cabor_id)
                ? buildReportLink('distribution', filters, {
                    organization_ids: item.organization_id ? [item.organization_id] : filters.organization_ids,
                    cabor_ids: item.cabor_id ? [item.cabor_id] : filters.cabor_ids,
                  })
                : null;
              const row = <div className="flex items-center gap-3 p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-800">{item.organization_name || 'Tanpa organisasi'}</p><p className="truncate text-xs text-slate-500">{item.cabor_name || 'Semua cabor'} · {formatQualityNumber(item.profiles)} profil · {formatQualityNumber(item.issues)} masalah</p></div><strong className="text-red-600">{formatQualityScore(item.average_score)}%</strong></div>;
              return to ? <Link key={`${item.organization_id}-${item.cabor_id}-${index}`} to={to} className="block hover:bg-red-50/40">{row}</Link> : <div key={`${item.organization_id}-${item.cabor_id}-${index}`}>{row}</div>;
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileDetailDrawer({ item, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const coverage = Object.entries(parseQualityJSON(item.source_coverage, {}));
  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="quality-profile-title">
      <button type="button" className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-label="Tutup detail profil" />
      <div className="relative h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-red-600">Detail read-only</p><h2 id="quality-profile-title" className="mt-1 text-2xl font-bold text-slate-900">{item.name}</h2><p className="mt-1 text-sm text-slate-500">{qualityLabel(item.profile_type)} #{item.profile_id}</p></div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ['Organisasi', item.organization_name], ['Cabor', item.cabor_name], ['Pengcab', item.pengcab_name],
            ['Skor', `${formatQualityScore(item.score)}%`], ['Kategori', qualityLabel(item.category)], ['Prioritas', qualityLabel(item.priority)],
            ['NIK (masked)', item.nik_display], ['No. KK (masked)', item.kk_display], ['Telepon (masked)', item.phone_display], ['Email (masked)', item.email_display],
            ['Dibuat', formatQualityDateTime(item.source_created_at)], ['Diperbarui', formatQualityDateTime(item.source_updated_at)],
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-semibold text-slate-800">{value || '-'}</p></div>)}
        </div>
        <div className="mt-5 rounded-xl border border-slate-200 p-4"><p className="text-sm font-bold text-slate-800">Field yang belum lengkap</p><div className="mt-2 flex flex-wrap gap-2">{item.missing_fields?.length ? item.missing_fields.map((field) => <span key={field} className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">{field}</span>) : <span className="text-sm text-slate-500">Tidak ada.</span>}</div></div>
        {coverage.length > 0 && <div className="mt-5 rounded-xl border border-slate-200 p-4"><p className="text-sm font-bold text-slate-800">Cakupan sumber baris</p><div className="mt-2 flex flex-wrap gap-2">{coverage.map(([key, value]) => <span key={key} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${value ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{qualityLabel(key)}: {value ? 'tersedia' : 'belum tersedia'}</span>)}</div></div>}
      </div>
    </div>
  );
}

function ProfileReport({ rows }) {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[1150px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Profil</th><th className="px-4 py-3">Organisasi / Cabor</th><th className="px-4 py-3">Skor</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Masalah</th><th className="px-4 py-3">Field kurang</th><th className="px-4 py-3">Prioritas</th><th className="px-4 py-3">Kontak masked</th><th className="px-4 py-3">Diperbarui</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{rows.map((item) => <tr key={`${item.profile_type}-${item.profile_id}`} onClick={() => setSelected(item)} className="cursor-pointer hover:bg-red-50/30" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') setSelected(item); }}><td className="px-4 py-4"><p className="font-semibold text-slate-800">{item.name}</p><p className="text-xs text-slate-400">#{item.profile_id}</p></td><td className="px-4 py-4"><p>{item.organization_name || '-'}</p><p className="text-xs text-slate-500">{item.cabor_name || '-'}</p></td><td className="px-4 py-4 font-bold text-slate-800">{formatQualityScore(item.score)}%</td><td className="px-4 py-4"><Badge value={item.category} /></td><td className="px-4 py-4">{formatQualityNumber(item.issue_count)}</td><td className="max-w-xs px-4 py-4 text-xs text-slate-600">{item.missing_fields?.join(', ') || '-'}</td><td className="px-4 py-4"><Badge value={item.priority} /></td><td className="px-4 py-4 text-xs"><p>{item.phone_display || '-'}</p><p>{item.email_display || '-'}</p></td><td className="px-4 py-4 text-xs text-slate-500">{formatQualityDateTime(item.source_updated_at)}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">{rows.map((item) => <button type="button" key={`${item.profile_type}-${item.profile_id}`} onClick={() => setSelected(item)} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-800">{item.name}</p><p className="text-xs text-slate-500">{item.organization_name || '-'} · {item.cabor_name || '-'}</p></div><strong className="text-red-600">{formatQualityScore(item.score)}%</strong></div><div className="mt-3 flex flex-wrap gap-2"><Badge value={item.category} /><Badge value={item.priority} /><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{formatQualityNumber(item.issue_count)} masalah</span></div><p className="mt-3 text-xs text-slate-500">Kontak: {item.phone_display || '-'} · {item.email_display || '-'}</p><p className="mt-1 text-xs text-slate-400">Diperbarui {formatQualityDateTime(item.source_updated_at)}</p></button>)}</div>
      {selected && <ProfileDetailDrawer item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function entityLabel(entity) {
  return `${qualityLabel(entity?.type, 'Profil')} #${entity?.id || '-'}`;
}

function DuplicateReport({ rows }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {rows.map((item) => {
        const entities = parseQualityJSON(item.entity_ids, []);
        const details = parseQualityJSON(item.details, {});
        return <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Kandidat #{item.id}</p><h3 className="mt-1 font-bold text-slate-900">{item.title}</h3></div><div className="flex flex-wrap gap-2"><Badge value={item.finding_type} /><Badge value={item.priority} /></div></div><div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div className="rounded-xl bg-slate-50 p-3"><p className="font-semibold text-slate-800">{entities[0]?.name || entityLabel(entities[0])}</p><p className="text-xs text-slate-500">{entityLabel(entities[0])}</p></div><span className="text-xs font-bold text-slate-400">VS</span><div className="rounded-xl bg-slate-50 p-3"><p className="font-semibold text-slate-800">{entities[1]?.name || entityLabel(entities[1])}</p><p className="text-xs text-slate-500">{entityLabel(entities[1])}</p></div></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs uppercase text-slate-400">Sinyal</dt><dd className="font-semibold text-slate-700">{qualityLabel(details.signal)}</dd></div><div><dt className="text-xs uppercase text-slate-400">Status</dt><dd className="font-semibold text-slate-700">{qualityLabel(item.status)}</dd></div><div><dt className="text-xs uppercase text-slate-400">Organisasi / Cabor</dt><dd className="font-semibold text-slate-700">{item.organization_name || '-'} / {item.cabor_name || '-'}</dd></div><div><dt className="text-xs uppercase text-slate-400">Terakhir ditemukan</dt><dd className="font-semibold text-slate-700">{formatQualityDateTime(item.last_seen_at)}</dd></div></dl></article>;
      })}
    </div>
  );
}

function ValidityReport({ rows }) {
  return (
    <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
      <table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Jenis masalah</th><th className="px-4 py-3">Profil terkait</th><th className="px-4 py-3">Prioritas</th><th className="px-4 py-3">Judul</th><th className="px-4 py-3">Scope</th><th className="px-4 py-3">Terakhir terdeteksi</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((item) => { const entities = parseQualityJSON(item.entity_ids, []); return <tr key={item.id}><td className="px-4 py-4"><Badge value={item.finding_type} /></td><td className="px-4 py-4 font-semibold text-slate-700">{entities.map(entityLabel).join(', ') || entityLabel({ type: item.entity_type })}</td><td className="px-4 py-4"><Badge value={item.priority} /></td><td className="px-4 py-4 text-slate-700">{item.title}</td><td className="px-4 py-4"><p>{item.organization_name || '-'}</p><p className="text-xs text-slate-500">{item.cabor_name || '-'}</p></td><td className="px-4 py-4 text-xs text-slate-500">{formatQualityDateTime(item.last_seen_at)}</td></tr>; })}</tbody></table>
    </div>
  );
}

function ValidityMobile({ rows }) {
  return <div className="space-y-3 md:hidden">{rows.map((item) => { const entities = parseQualityJSON(item.entity_ids, []); return <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap gap-2"><Badge value={item.finding_type} /><Badge value={item.priority} /></div><h3 className="mt-3 font-bold text-slate-800">{item.title}</h3><p className="mt-2 text-sm text-slate-600">{entities.map(entityLabel).join(', ') || entityLabel({ type: item.entity_type })}</p><p className="mt-2 text-xs text-slate-500">{item.organization_name || '-'} · {item.cabor_name || '-'}</p><p className="mt-1 text-xs text-slate-400">Terdeteksi {formatQualityDateTime(item.last_seen_at)}</p></article>; })}</div>;
}

function DocumentReport({ rows }) {
  return (
    <><div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Profil</th><th className="px-4 py-3">Jenis dokumen</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">MIME</th><th className="px-4 py-3">Masa berlaku</th><th className="px-4 py-3">Organisasi / Cabor</th><th className="px-4 py-3">Diperiksa</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((item) => <tr key={item.id}><td className="px-4 py-4"><p className="font-semibold text-slate-800">{item.profile_name}</p><p className="text-xs text-slate-400">{qualityLabel(item.profile_type)} #{item.profile_id}</p></td><td className="px-4 py-4">{qualityLabel(item.document_type)}</td><td className="px-4 py-4"><Badge value={item.status} /></td><td className="px-4 py-4 text-xs text-slate-600">{item.detected_mime || '-'}</td><td className="px-4 py-4">{formatQualityDate(item.expires_at)}</td><td className="px-4 py-4"><p>{item.organization_name || '-'}</p><p className="text-xs text-slate-500">{item.cabor_name || '-'}</p></td><td className="px-4 py-4 text-xs text-slate-500">{formatQualityDateTime(item.checked_at)}</td></tr>)}</tbody></table></div><div className="space-y-3 md:hidden">{rows.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-800">{item.profile_name}</p><p className="text-xs text-slate-500">{qualityLabel(item.profile_type)} #{item.profile_id}</p></div><Badge value={item.status} /></div><dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-400">Dokumen</dt><dd className="font-semibold">{qualityLabel(item.document_type)}</dd></div><div><dt className="text-xs text-slate-400">MIME</dt><dd className="break-all font-semibold">{item.detected_mime || '-'}</dd></div><div><dt className="text-xs text-slate-400">Masa berlaku</dt><dd className="font-semibold">{formatQualityDate(item.expires_at)}</dd></div><div><dt className="text-xs text-slate-400">Diperiksa</dt><dd className="font-semibold">{formatQualityDateTime(item.checked_at)}</dd></div></dl><p className="mt-3 text-xs text-slate-500">{item.organization_name || '-'} · {item.cabor_name || '-'}</p></article>)}</div></>
  );
}

function DistributionReport({ rows }) {
  return (
    <><div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Wilayah</th><th className="px-4 py-3">Organisasi</th><th className="px-4 py-3">Pengcab</th><th className="px-4 py-3">Cabor</th><th className="px-4 py-3 text-right">Profil</th><th className="px-4 py-3 text-right">Skor rata-rata</th><th className="px-4 py-3 text-right">Masalah</th><th className="px-4 py-3">Pemetaan</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((item, index) => <tr key={`${item.organization_id}-${item.cabor_id}-${index}`}><td className="px-4 py-4">{item.region_name || '-'}</td><td className="px-4 py-4 font-semibold text-slate-800">{item.organization_name || '-'}</td><td className="px-4 py-4">{item.pengcab_name || '-'}</td><td className="px-4 py-4">{item.cabor_name || '-'}</td><td className="px-4 py-4 text-right">{formatQualityNumber(item.profiles)}</td><td className="px-4 py-4 text-right font-bold">{formatQualityScore(item.average_score)}%</td><td className="px-4 py-4 text-right">{formatQualityNumber(item.issues)}</td><td className="px-4 py-4">{item.unmapped_pengcab ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700"><AlertTriangle className="h-4 w-4" /> Belum terpetakan</span> : <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Terpetakan</span>}</td></tr>)}</tbody></table></div><div className="grid gap-3 md:hidden">{rows.map((item, index) => <article key={`${item.organization_id}-${item.cabor_id}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-800">{item.organization_name || '-'}</p><p className="text-xs text-slate-500">{item.region_name || '-'} · {item.cabor_name || '-'}</p></div><strong className="text-red-600">{formatQualityScore(item.average_score)}%</strong></div><div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Profil</p><p className="font-bold">{formatQualityNumber(item.profiles)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Masalah</p><p className="font-bold">{formatQualityNumber(item.issues)}</p></div></div><p className="mt-3 text-xs text-slate-500">Pengcab: {item.pengcab_name || '-'}</p>{item.unmapped_pengcab && <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700"><AlertTriangle className="h-4 w-4" /> Relasi pengcab belum terpetakan</p>}</article>)}</div></>
  );
}

export function DataQualityReportContent({ reportKey, response, filters, allowedReportKeys }) {
  const rows = Array.isArray(response?.data) ? response.data : [];
  switch (reportKey) {
    case 'summary':
      return <SummaryReport response={response} filters={filters} allowedReportKeys={allowedReportKeys} />;
    case 'athletes':
    case 'coaches':
      return <ProfileReport rows={rows} />;
    case 'duplicates':
      return <DuplicateReport rows={rows} />;
    case 'validity':
      return <><ValidityReport rows={rows} /><ValidityMobile rows={rows} /></>;
    case 'documents':
      return <DocumentReport rows={rows} />;
    case 'distribution':
      return <DistributionReport rows={rows} />;
    default:
      return null;
  }
}