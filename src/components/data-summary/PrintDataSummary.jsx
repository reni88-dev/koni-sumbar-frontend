import { useRef, useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import {
  TREND_GRANULARITY_DAILY,
  formatTrendDateRange,
  getSampledTrendLabelIndexes,
} from '../../utils/dataSummaryTrend';

const NUMBER_FORMATTER = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const DECIMAL_FORMATTER = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const PRINT_DELAY_MS = 200;
const DOCUMENT_READY_TIMEOUT_MS = 1500;

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character]);
}

function formatNumber(value) {
  return NUMBER_FORMATTER.format(toFiniteNumber(value));
}

function formatDecimal(value) {
  return DECIMAL_FORMATTER.format(toFiniteNumber(value));
}

function formatPercentage(value) {
  return `${DECIMAL_FORMATTER.format(toFiniteNumber(value))}%`;
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 'Tidak tersedia' : DATE_TIME_FORMATTER.format(date);
}

function clampPercentage(value) {
  return Math.max(0, Math.min(100, toFiniteNumber(value)));
}

function resolveOptionLabel(options, selectedId, fallback) {
  if (selectedId === undefined || selectedId === null || selectedId === '') return fallback;
  const selected = asArray(options).find((option) => String(option?.id) === String(selectedId));
  return selected?.name || `ID ${selectedId}`;
}

function buildFilterDetails(data, filters) {
  const options = data?.filter_options || {};
  const statusLabels = {
    all: 'Aktif dan tidak aktif',
    active: 'Aktif',
    inactive: 'Tidak aktif',
  };
  const organizationId = filters?.organizationId ?? data?.filters?.organization_id ?? '';
  const caborId = filters?.caborId ?? data?.filters?.cabor_id ?? '';
  const status = filters?.status || data?.filters?.status || 'all';
  const granularity = data?.filters?.trend_granularity || filters?.trendGranularity || 'monthly';
  const startDate = data?.filters?.trend_start_date || filters?.trendStartDate || '';
  const endDate = data?.filters?.trend_end_date || filters?.trendEndDate || '';

  return [
    ['Organisasi', resolveOptionLabel(options.organizations, organizationId, 'Semua organisasi')],
    ['Cabang olahraga', resolveOptionLabel(options.cabors, caborId, 'Semua cabor')],
    ['Status data', statusLabels[status] || status],
    ['Granularitas tren', granularity === TREND_GRANULARITY_DAILY ? 'Harian' : 'Bulanan'],
    ['Rentang tren', formatTrendDateRange(startDate, endDate)],
  ];
}

function buildKpiGrid(data, totalOrganizations) {
  const overview = data?.overview || {};
  const athletes = overview.athletes || {};
  const coaches = overview.coaches || {};
  const items = [
    {
      label: 'Total atlet',
      value: formatNumber(athletes.total),
      detail: `${formatNumber(athletes.active)} aktif · ${formatNumber(athletes.inactive)} tidak aktif`,
      tone: 'red',
    },
    {
      label: 'Total pelatih',
      value: formatNumber(coaches.total),
      detail: `${formatNumber(coaches.active)} aktif · ${formatNumber(coaches.inactive)} tidak aktif`,
      tone: 'blue',
    },
    {
      label: 'Total Cabor Induk',
      value: formatNumber(overview.total_parent_cabors),
      detail: 'Mengikuti scope akses dan filter aktif',
      tone: 'amber',
    },
    {
      label: 'Total Organisasi',
      value: formatNumber(totalOrganizations),
      detail: 'Tidak termasuk kategori Tidak diketahui',
      tone: 'violet',
    },
    {
      label: 'Akun terhubung',
      value: formatNumber(toFiniteNumber(athletes.linked_users) + toFiniteNumber(coaches.linked_users)),
      detail: `Atlet ${formatNumber(athletes.linked_users)} · Pelatih ${formatNumber(coaches.linked_users)}`,
      tone: 'emerald',
    },
    {
      label: 'Rata-rata umur',
      value: `${formatDecimal(athletes.average_age)} / ${formatDecimal(coaches.average_age)}`,
      detail: 'Atlet / Pelatih (tahun)',
      tone: 'cyan',
    },
  ];

  return `<div class="kpi-grid">
    ${items.map((item) => `<article class="kpi-card tone-${item.tone}">
      <div class="kpi-label">${escapeHtml(item.label)}</div>
      <div class="kpi-value">${escapeHtml(item.value)}</div>
      <div class="kpi-detail">${escapeHtml(item.detail)}</div>
    </article>`).join('')}
  </div>`;
}

function buildSportContingentDistributionSection(distribution) {
  const sports = asArray(distribution?.sports);
  const threshold = toFiniteNumber(distribution?.threshold) || 10;
  const rows = sports.length
    ? sports.map((sport, index) => {
        const federationCode = String(sport?.federation_code || '').trim();
        const caborName = sport?.cabor_name || `Cabor #${sport?.cabor_id || '-'}`;
        const displayName = federationCode ? `${caborName} (${federationCode})` : caborName;
        const groupLabel = sport?.group === 'large' ? 'Cabor Besar' : 'Cabor Kecil';
        const contingentNames = asArray(sport?.contingents)
          .map((contingent) => `<div><span>${escapeHtml(contingent?.name || `Organisasi #${contingent?.organization_id || '-'}`)}</span><strong>${escapeHtml(formatNumber(contingent?.athlete_count))} atlet</strong></div>`)
          .join('');
        return `<tr>
          <td class="number-cell">${escapeHtml(formatNumber(index + 1))}</td>
          <td class="strong">${escapeHtml(displayName)}</td>
          <td>${escapeHtml(groupLabel)}</td>
          <td class="number-cell">${escapeHtml(formatNumber(sport?.contingent_count))}</td>
          <td class="number-cell">${escapeHtml(formatNumber(sport?.athlete_count))}</td>
          <td><div class="contingent-list">${contingentNames}</div></td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="6" class="empty-cell">Tidak ada distribusi kontingen untuk scope dan filter aktif.</td></tr>';

  return `<section class="report-section sport-contingent-section">
    <div class="section-heading avoid-break">
      <div>
        <h3>Kelompok Cabor berdasarkan Kontingen</h3>
        <p>Cabor Besar memiliki minimal ${escapeHtml(formatNumber(threshold))} kontingen kab/kota; Cabor Kecil memiliki maksimal ${escapeHtml(formatNumber(Math.max(0, threshold - 1)))} kontingen. Data mengikuti filter SatuData yang aktif.</p>
      </div>
    </div>
    <div class="sport-contingent-kpi-grid">
      <article class="kpi-card tone-emerald"><div class="kpi-label">Total Cabor Besar</div><div class="kpi-value">${escapeHtml(formatNumber(distribution?.large_count))}</div></article>
      <article class="kpi-card tone-amber"><div class="kpi-label">Total Cabor Kecil</div><div class="kpi-value">${escapeHtml(formatNumber(distribution?.small_count))}</div></article>
    </div>
    <div class="table-section sport-contingent-table-section">
      <table class="sport-contingent-table">
        <thead><tr><th class="number-cell">No.</th><th>Cabang olahraga</th><th>Kelompok</th><th class="number-cell">Kontingen</th><th class="number-cell">Atlet</th><th>Rincian kontingen kab/kota</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;
}

function buildTrendChart(items, granularity) {
  const trends = asArray(items);
  if (!trends.length) return '<div class="empty-state">Belum ada data tren.</div>';

  const width = 1000;
  const height = 280;
  const left = 58;
  const right = 24;
  const top = 22;
  const bottom = 48;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maximum = Math.max(1, ...trends.flatMap((item) => [toFiniteNumber(item?.athletes), toFiniteNumber(item?.coaches)]));
  const x = (index) => trends.length === 1 ? left + plotWidth / 2 : left + (index * plotWidth) / (trends.length - 1);
  const y = (value) => top + plotHeight - (toFiniteNumber(value) / maximum) * plotHeight;
  const athletePoints = trends.map((item, index) => `${x(index).toFixed(2)},${y(item?.athletes).toFixed(2)}`).join(' ');
  const coachPoints = trends.map((item, index) => `${x(index).toFixed(2)},${y(item?.coaches).toFixed(2)}`).join(' ');
  const visibleLabelIndexes = new Set(getSampledTrendLabelIndexes(trends.length));
  const unit = granularity === TREND_GRANULARITY_DAILY ? 'hari' : 'bulan';

  const grid = Array.from({ length: 5 }, (_, index) => {
    const gridY = top + (index * plotHeight) / 4;
    const value = maximum * (1 - index / 4);
    return `<line x1="${left}" x2="${width - right}" y1="${gridY}" y2="${gridY}" stroke="#e2e8f0" stroke-width="1" />
      <text x="${left - 10}" y="${gridY + 4}" text-anchor="end" class="axis-label">${escapeHtml(formatDecimal(value))}</text>`;
  }).join('');

  const dots = trends.map((item, index) => `<circle cx="${x(index)}" cy="${y(item?.athletes)}" r="3.5" fill="#dc2626" />
    <circle cx="${x(index)}" cy="${y(item?.coaches)}" r="3.5" fill="#2563eb" />`).join('');

  const labels = trends.map((item, index) => {
    if (!visibleLabelIndexes.has(index)) return '';
    return `<text x="${x(index)}" y="${height - 18}" text-anchor="middle" class="axis-label">${escapeHtml(item?.label || item?.date || item?.month || '-')}</text>`;
  }).join('');

  return `<div class="trend-figure avoid-break">
    <div class="legend">
      <span><i class="legend-dot athlete"></i>Atlet</span>
      <span><i class="legend-dot coach"></i>Pelatih</span>
    </div>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafik tren penambahan atlet dan pelatih per ${unit}">
      ${grid}
      <polyline points="${athletePoints}" fill="none" stroke="#dc2626" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" />
      <polyline points="${coachPoints}" fill="none" stroke="#2563eb" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" />
      ${dots}
      ${labels}
    </svg>
  </div>`;
}

function buildTrendTable(items, granularity) {
  const trends = asArray(items);
  const rows = trends.length
    ? trends.map((item) => `<tr>
        <td>${escapeHtml(item?.label || item?.date || item?.month || '-')}</td>
        <td class="number-cell">${escapeHtml(formatNumber(item?.athletes))}</td>
        <td class="number-cell">${escapeHtml(formatNumber(item?.coaches))}</td>
        <td class="number-cell strong">${escapeHtml(formatNumber(toFiniteNumber(item?.athletes) + toFiniteNumber(item?.coaches)))}</td>
      </tr>`).join('')
    : '<tr><td colspan="4" class="empty-cell">Belum ada data.</td></tr>';
  const periodHeading = granularity === TREND_GRANULARITY_DAILY ? 'Tanggal' : 'Bulan';

  return `<div class="table-section">
    <table>
      <thead><tr><th>${periodHeading}</th><th class="number-cell">Atlet</th><th class="number-cell">Pelatih</th><th class="number-cell">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}
function buildHorizontalDistribution(title, items) {
  const distribution = asArray(items);
  const maximum = Math.max(1, ...distribution.map((item) => toFiniteNumber(item?.count)));
  const rows = distribution.length
    ? distribution.map((item) => {
        const width = clampPercentage((toFiniteNumber(item?.count) / maximum) * 100);
        return `<div class="bar-item">
          <div class="bar-heading">
            <span class="bar-label">${escapeHtml(item?.label || 'Tidak diketahui')}</span>
            <span class="bar-value">${escapeHtml(formatNumber(item?.count))} <small>(${escapeHtml(formatPercentage(item?.percentage))})</small></span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
        </div>`;
      }).join('')
    : '<div class="empty-state">Belum ada data.</div>';

  return `<section class="report-section bar-section">
    <h3>${escapeHtml(title)}</h3>
    <div class="bar-grid">${rows}</div>
  </section>`;
}

function buildMasterDistributionTable(title, items) {
  const distribution = asArray(items);
  const rows = distribution.length
    ? distribution.map((item) => `<tr>
        <td>${escapeHtml(item?.label || 'Tidak diketahui')}</td>
        <td class="number-cell">${escapeHtml(formatNumber(item?.athletes))}</td>
        <td class="number-cell">${escapeHtml(formatNumber(item?.coaches))}</td>
        <td class="number-cell strong">${escapeHtml(formatNumber(item?.count))}</td>
        <td class="number-cell">${escapeHtml(formatPercentage(item?.percentage))}</td>
      </tr>`).join('')
    : '<tr><td colspan="5" class="empty-cell">Belum ada data.</td></tr>';

  return `<section class="report-section table-section">
    <h3>${escapeHtml(title)}</h3>
    <table class="distribution-table">
      <thead><tr><th>Nama</th><th class="number-cell">Atlet</th><th class="number-cell">Pelatih</th><th class="number-cell">Total</th><th class="number-cell">Persentase</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

function buildCompletenessGroups(quality) {
  const groups = asArray(quality?.completeness);
  if (!groups.length) return '<div class="empty-state">Belum ada data kelengkapan.</div>';

  return groups.map((group) => {
    const fields = asArray(group?.fields);
    const rows = fields.length
      ? fields.map((field) => `<tr>
          <td>${escapeHtml(field?.label || '-')}</td>
          <td class="number-cell">${escapeHtml(formatNumber(field?.completed))}</td>
          <td class="number-cell">${escapeHtml(formatNumber(field?.total))}</td>
          <td class="number-cell strong">${escapeHtml(formatPercentage(field?.percentage))}</td>
        </tr>`).join('')
      : '<tr><td colspan="4" class="empty-cell">Belum ada data.</td></tr>';

    return `<div class="quality-group table-section">
      <h4>${escapeHtml(group?.label || 'Kelengkapan')}</h4>
      <table>
        <thead><tr><th>Atribut</th><th class="number-cell">Terisi</th><th class="number-cell">Total</th><th class="number-cell">Persentase</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join('');
}

function buildOwnershipTable(quality) {
  const ownership = asArray(quality?.ownership);
  const rows = ownership.length
    ? ownership.map((item) => `<tr>
        <td>${escapeHtml(item?.label || '-')}</td>
        <td class="number-cell">${escapeHtml(formatNumber(item?.count))}</td>
        <td class="number-cell">${escapeHtml(formatNumber(item?.total))}</td>
        <td class="number-cell strong">${escapeHtml(formatPercentage(item?.percentage))}</td>
      </tr>`).join('')
    : '<tr><td colspan="4" class="empty-cell">Belum ada data.</td></tr>';

  return `<div class="quality-group table-section">
    <h4>Kepemilikan atribut dan dokumen</h4>
    <table>
      <thead><tr><th>Atribut / dokumen</th><th class="number-cell">Memiliki</th><th class="number-cell">Total</th><th class="number-cell">Persentase</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function buildQualitySection(title, quality) {
  return `<section class="report-section quality-section">
    <div class="section-heading avoid-break">
      <div>
        <h3>Kelengkapan ${escapeHtml(title)}</h3>
        <p>Indeks tujuh field inti berbobot sama.</p>
      </div>
      <div class="index-badge">${escapeHtml(formatPercentage(quality?.core_completeness_index))}</div>
    </div>
    ${buildCompletenessGroups(quality)}
    ${buildOwnershipTable(quality)}
  </section>`;
}

function buildDuplicateSummary(duplicate) {
  const items = [
    ['Confidence tinggi', duplicate?.high, 'red'],
    ['Suspek', duplicate?.suspect, 'amber'],
    ['Belum direview', duplicate?.unreviewed, 'blue'],
    ['Perlu review', duplicate?.needs_review, 'violet'],
    ['Duplikat terkonfirmasi', duplicate?.confirmed_duplicates, 'emerald'],
    ['Orang berbeda', duplicate?.different_person, 'slate'],
    ['Indikasi peran ganda', duplicate?.dual_role_indications, 'cyan'],
    ['Peran ganda terkonfirmasi', duplicate?.confirmed_dual_roles, 'teal'],
  ];

  return `<section class="report-section">
    <h3>Ringkasan Analisis Duplikat</h3>
    <p class="section-description">Agregat kandidat dalam scope dan filter summary saat ini.</p>
    <div class="duplicate-grid">
      ${items.map(([label, value, tone]) => `<article class="duplicate-card tone-${tone}">
        <div>${escapeHtml(label)}</div>
        <strong>${escapeHtml(formatNumber(value))}</strong>
      </article>`).join('')}
    </div>
  </section>`;
}

function buildPrintHtml({ data, filters, totalOrganizations, printedAt }) {
  const filterDetails = buildFilterDetails(data, filters);
  const distributions = data?.distributions || {};
  const quality = data?.data_quality || {};
  const trendGranularity = data?.filters?.trend_granularity || filters?.trendGranularity || 'monthly';
  const trendUnit = trendGranularity === TREND_GRANULARITY_DAILY ? 'hari' : 'bulan';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Data Summary KONI Sumatera Barat</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html { background: #ffffff; }
    body { margin: 0; color: #1e293b; background: #ffffff; font-family: "Segoe UI", Arial, sans-serif; font-size: 10.5px; line-height: 1.45; }
    h1, h2, h3, h4, p { margin: 0; }
    .report-header { border-bottom: 3px solid #b91c1c; padding-bottom: 12px; break-after: avoid; page-break-after: avoid; }
    .brand { color: #991b1b; font-size: 12px; font-weight: 800; letter-spacing: 1.8px; }
    .report-title { margin-top: 3px; color: #0f172a; font-size: 23px; line-height: 1.2; }
    .report-subtitle { margin-top: 4px; color: #64748b; font-size: 10px; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin-top: 12px; }
    .meta-item { min-width: 0; border: 1px solid #e2e8f0; border-radius: 7px; padding: 7px 9px; background: #f8fafc; break-inside: avoid; }
    .meta-item span { display: block; color: #64748b; font-size: 8px; font-weight: 700; letter-spacing: .35px; text-transform: uppercase; }
    .meta-item strong { display: block; margin-top: 2px; color: #0f172a; font-size: 10px; overflow-wrap: anywhere; }
    .scope-note { margin-top: 7px; color: #64748b; font-size: 9px; }
    .report-section { margin-top: 15px; }
    .report-section > h3, .section-heading h3 { color: #0f172a; font-size: 14px; break-after: avoid; page-break-after: avoid; }
    .section-description, .section-heading p { margin-top: 2px; color: #64748b; font-size: 9px; }
    .avoid-break, .kpi-card, .bar-item, .duplicate-card { break-inside: avoid; page-break-inside: avoid; }
    .kpi-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 7px; margin-top: 15px; }
    .sport-contingent-kpi-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin-top: 9px; }
    .kpi-card { min-width: 0; border: 1px solid #e2e8f0; border-top: 4px solid #64748b; border-radius: 8px; padding: 9px; background: #ffffff; }
    .kpi-label { color: #64748b; font-size: 8.5px; font-weight: 700; }
    .kpi-value { margin-top: 2px; color: #0f172a; font-size: 17px; font-weight: 800; overflow-wrap: anywhere; }
    .kpi-detail { margin-top: 2px; color: #64748b; font-size: 7.8px; }
    .tone-red { border-top-color: #dc2626; } .tone-blue { border-top-color: #2563eb; }
    .tone-amber { border-top-color: #d97706; } .tone-violet { border-top-color: #7c3aed; }
    .tone-emerald { border-top-color: #059669; } .tone-cyan { border-top-color: #0891b2; }
    .tone-teal { border-top-color: #0f766e; } .tone-slate { border-top-color: #64748b; }
    .trend-figure { margin-top: 8px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px 4px; }
    .trend-figure svg { display: block; width: 100%; height: 230px; }
    .axis-label { fill: #64748b; font-family: "Segoe UI", Arial, sans-serif; font-size: 10px; }
    .legend { display: flex; justify-content: flex-end; gap: 16px; color: #475569; font-size: 9px; font-weight: 700; }
    .legend span { display: inline-flex; align-items: center; gap: 5px; }
    .legend-dot { display: inline-block; width: 8px; height: 8px; border-radius: 999px; }
    .legend-dot.athlete { background: #dc2626; } .legend-dot.coach { background: #2563eb; }
    .bar-section { break-inside: auto; page-break-inside: auto; }
    .bar-grid { margin-top: 8px; }
    .bar-item + .bar-item { margin-top: 7px; }
    .bar-item { min-width: 0; }
    .bar-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
    .bar-label { min-width: 0; color: #334155; font-weight: 600; overflow-wrap: anywhere; }
    .bar-value { flex: none; color: #0f172a; font-weight: 800; }
    .bar-value small { color: #64748b; font-size: 8px; font-weight: 600; }
    .bar-track { height: 7px; margin-top: 3px; overflow: hidden; border-radius: 999px; background: #e2e8f0; }
    .bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #ef4444, #b91c1c); }
    .table-section { break-inside: auto; page-break-inside: auto; }
    table { width: 100%; margin-top: 7px; border-collapse: collapse; table-layout: fixed; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    th, td { border: 1px solid #cbd5e1; padding: 5px 7px; vertical-align: top; overflow-wrap: anywhere; }
    th { color: #334155; background: #f1f5f9; font-size: 8px; font-weight: 800; letter-spacing: .3px; text-align: left; text-transform: uppercase; }
    td { color: #475569; }
    td:first-child, th:first-child { width: 50%; }
    .number-cell { text-align: right; white-space: nowrap; }
    .strong { color: #0f172a; font-weight: 800; }
    .empty-cell, .empty-state { padding: 12px; color: #94a3b8; text-align: center; }
    .muted { color: #94a3b8; }
    .sport-contingent-table-section { margin-top: 9px; }
    .sport-contingent-table { font-size: 8.5px; }
    .sport-contingent-table td:first-child, .sport-contingent-table th:first-child { width: 5%; }
    .sport-contingent-table td:nth-child(2), .sport-contingent-table th:nth-child(2) { width: 18%; }
    .sport-contingent-table td:nth-child(3), .sport-contingent-table th:nth-child(3) { width: 11%; }
    .sport-contingent-table td:nth-child(4), .sport-contingent-table th:nth-child(4) { width: 9%; }
    .sport-contingent-table td:nth-child(5), .sport-contingent-table th:nth-child(5) { width: 8%; }
    .sport-contingent-table td:nth-child(6), .sport-contingent-table th:nth-child(6) { width: 49%; }
    .contingent-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 3px 10px; }
    .contingent-list div { display: flex; min-width: 0; justify-content: space-between; gap: 6px; border-bottom: 1px dotted #e2e8f0; padding-bottom: 2px; }
    .contingent-list span { min-width: 0; overflow-wrap: anywhere; }
    .contingent-list strong { flex: none; color: #475569; font-size: 8px; }
    .empty-state { margin-top: 7px; border: 1px dashed #cbd5e1; border-radius: 7px; background: #f8fafc; }
    .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .index-badge { flex: none; border-radius: 7px; padding: 6px 10px; color: #b91c1c; background: #fef2f2; font-size: 14px; font-weight: 800; }
    .quality-group { margin-top: 10px; }
    .quality-group h4 { color: #475569; font-size: 9px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; break-after: avoid; page-break-after: avoid; }
    .duplicate-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin-top: 8px; }
    .duplicate-card { border: 1px solid #e2e8f0; border-top: 3px solid #64748b; border-radius: 7px; padding: 8px 9px; background: #f8fafc; }
    .duplicate-card div { color: #64748b; font-size: 8px; font-weight: 700; }
    .duplicate-card strong { display: block; margin-top: 2px; color: #0f172a; font-size: 16px; }
    .report-footer { margin-top: 16px; border-top: 1px solid #cbd5e1; padding-top: 8px; color: #64748b; font-size: 8.5px; }
    @media print {
      body { margin: 0; }
      .report-section > h3, .quality-group h4, .section-heading { break-after: avoid; page-break-after: avoid; }
      .trend-figure, .kpi-grid, .sport-contingent-kpi-grid, .duplicate-grid { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header class="report-header">
    <div class="brand">KONI SUMATERA BARAT</div>
    <h1 class="report-title">LAPORAN DATA SUMMARY</h1>
    <p class="report-subtitle">Ringkasan agregat atlet, pelatih, distribusi cabor per kontingen, kualitas data, tren, distribusi, dan analisis duplikat.</p>
    <div class="meta-grid">
      ${filterDetails.map(([label, value]) => `<div class="meta-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}
      <div class="meta-item"><span>Data dibuat</span><strong>${escapeHtml(formatDateTime(data?.generated_at))}</strong></div>
      <div class="meta-item"><span>Laporan dicetak</span><strong>${escapeHtml(formatDateTime(printedAt))}</strong></div>
    </div>
    <p class="scope-note">Laporan mengikuti scope akses pengguna dan filter aktif pada saat dicetak.</p>
  </header>

  ${buildKpiGrid(data, totalOrganizations)}
  ${buildSportContingentDistributionSection(data?.sport_contingent_distribution)}

  <section class="report-section">
    <h3>Tren Penambahan Data</h3>
    <p class="section-description">Jumlah record baru per ${trendUnit} untuk rentang yang dipilih.</p>
    ${buildTrendChart(data?.trends, trendGranularity)}
    ${buildTrendTable(data?.trends, trendGranularity)}
  </section>

  ${buildHorizontalDistribution('Distribusi Gender Atlet', distributions.athlete_gender)}
  ${buildHorizontalDistribution('Distribusi Gender Pelatih', distributions.coach_gender)}
  ${buildHorizontalDistribution('Kelompok Umur Atlet', distributions.athlete_age_groups)}
  ${buildHorizontalDistribution('Kelompok Umur Pelatih', distributions.coach_age_groups)}
  ${buildHorizontalDistribution('Cluster Atlet', distributions.athlete_clusters)}
  ${buildHorizontalDistribution('Cluster Pelatih', distributions.coach_clusters)}
  ${buildHorizontalDistribution('Level Lisensi Pelatih', distributions.coach_license_levels)}

  ${buildMasterDistributionTable('Distribusi Cabang Olahraga', distributions.cabors)}
  ${buildMasterDistributionTable('Distribusi Organisasi', distributions.organizations)}

  ${buildQualitySection('Atlet', quality.athletes)}
  ${buildQualitySection('Pelatih', quality.coaches)}
  ${buildDuplicateSummary(data?.duplicate_summary)}

  <footer class="report-footer">
    Laporan memuat agregat SatuData dan rincian kontingen kab/kota per cabor; laporan tidak memuat NIK atau identitas individu.
  </footer>
</body>
</html>`;
}

function writePrintDocument(printWindow, html) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      printWindow.removeEventListener('load', finish);
      resolve();
    };
    const timeoutId = window.setTimeout(finish, DOCUMENT_READY_TIMEOUT_MS);

    printWindow.addEventListener('load', finish, { once: true });

    try {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      if (printWindow.document.readyState === 'complete') window.setTimeout(finish, 0);
    } catch (error) {
      settled = true;
      window.clearTimeout(timeoutId);
      printWindow.removeEventListener('load', finish);
      reject(error);
    }
  });
}

export function PrintDataSummary({
  data,
  filters,
  totalOrganizations = 0,
  disabled = false,
  isFetching = false,
}) {
  const [loading, setLoading] = useState(false);
  const printInProgressRef = useRef(false);
  const isBusy = loading || isFetching;
  const isDisabled = disabled || loading;

  const handlePrint = async () => {
    if (isDisabled || !data || printInProgressRef.current) return;

    printInProgressRef.current = true;
    setLoading(true);
    let printWindow = null;

    try {
      printWindow = window.open('', '_blank');
      if (!printWindow) {
        window.alert('Popup cetak diblokir. Izinkan popup untuk mencetak laporan data summary.');
        return;
      }

      printWindow.opener = null;
      printWindow.document.title = 'Menyiapkan laporan...';
      printWindow.document.body.innerHTML = '<p style="font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#475569">Menyiapkan laporan untuk dicetak...</p>';

      const html = buildPrintHtml({
        data,
        filters,
        totalOrganizations,
        printedAt: new Date(),
      });
      await writePrintDocument(printWindow, html);
      await new Promise((resolve) => window.setTimeout(resolve, PRINT_DELAY_MS));

      if (printWindow.closed) throw new Error('Jendela cetak telah ditutup.');
      printWindow.focus();
      printWindow.print();
    } catch {
      if (printWindow && !printWindow.closed) printWindow.close();
      window.alert('Gagal menyiapkan laporan data summary. Silakan coba lagi.');
    } finally {
      printInProgressRef.current = false;
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={isDisabled}
      aria-busy={isBusy}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      title="Cetak laporan Data Summary dan distribusi cabor per kontingen"
    >
      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
      {loading ? 'Menyiapkan...' : isFetching ? 'Memuat data...' : 'Cetak Laporan'}
    </button>
  );
}
