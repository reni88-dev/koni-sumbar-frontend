import { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileText, Layers, Loader2, Printer } from 'lucide-react';
import {
  formatQualityDate,
  formatQualityDateTime,
  formatQualityNumber,
  formatQualityScore,
  parseQualityJSON,
  qualityLabel,
} from '../../features/data-quality-report/formatters.js';
import { buildQualityFilterChips } from '../../features/data-quality-report/filterChips.js';
import { requestQualityReportPrintAll } from '../../hooks/queries/useDataQualityReports';
import { escapePrintHtml, printProfileDocument } from '../profilePrintUtils';

const PRINT_STYLES = `
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { margin: 0; color: #1e293b; background: #ffffff; font-family: "Segoe UI", Arial, sans-serif; font-size: 10px; line-height: 1.45; }
  h1, h2, h3, p { margin: 0; }
  .report-header { border-bottom: 3px solid #b91c1c; padding-bottom: 10px; }
  .brand { color: #991b1b; font-size: 11px; font-weight: 800; letter-spacing: 1.8px; }
  .report-title { margin-top: 3px; color: #0f172a; font-size: 21px; line-height: 1.2; }
  .report-subtitle { margin-top: 4px; color: #64748b; font-size: 10px; }
  .meta-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin-top: 10px; }
  .meta-item { border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; background: #f8fafc; break-inside: avoid; }
  .meta-item span { display: block; color: #64748b; font-size: 7.5px; font-weight: 700; letter-spacing: .35px; text-transform: uppercase; }
  .meta-item strong { display: block; margin-top: 2px; color: #0f172a; font-size: 9.5px; overflow-wrap: anywhere; }
  .filter-note { margin-top: 8px; color: #475569; font-size: 9px; }
  .section { margin-top: 14px; }
  .section h3 { color: #0f172a; font-size: 13px; break-after: avoid; page-break-after: avoid; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin-top: 12px; }
  .kpi-card { border: 1px solid #e2e8f0; border-top: 4px solid #dc2626; border-radius: 8px; padding: 9px; break-inside: avoid; }
  .kpi-label { color: #64748b; font-size: 8.5px; font-weight: 700; }
  .kpi-value { margin-top: 2px; color: #0f172a; font-size: 18px; font-weight: 800; }
  .two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  table { width: 100%; margin-top: 6px; border-collapse: collapse; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  th, td { border: 1px solid #cbd5e1; padding: 4px 6px; vertical-align: top; overflow-wrap: anywhere; }
  th { color: #334155; background: #f1f5f9; font-size: 7.5px; font-weight: 800; letter-spacing: .3px; text-align: left; text-transform: uppercase; }
  td { color: #334155; font-size: 9px; }
  .num { text-align: right; white-space: nowrap; }
  .empty-cell { padding: 10px; color: #94a3b8; text-align: center; }
  .report-footer { margin-top: 14px; border-top: 1px solid #cbd5e1; padding-top: 6px; color: #64748b; font-size: 8.5px; }
`;

function entityLabel(entity) {
  return `${qualityLabel(entity?.type, 'Profil')} #${entity?.id || '-'}`;
}

function entityLines(item) {
  return parseQualityJSON(item.entity_ids, []).map((entity) => (
    entity?.name ? `${entity.name} (${entityLabel(entity)})` : entityLabel(entity)
  ));
}

const organizationCabor = (item) => [item.organization_name || '-', item.cabor_name || '-'];

const PROFILE_COLUMNS = [
  { label: 'Profil', render: (item) => [item.name, `#${item.profile_id}`] },
  { label: 'Organisasi / Cabor', render: organizationCabor },
  { label: 'Skor', num: true, render: (item) => `${formatQualityScore(item.score)}%` },
  { label: 'Kategori', render: (item) => qualityLabel(item.category) },
  { label: 'Masalah', num: true, render: (item) => formatQualityNumber(item.issue_count) },
  { label: 'Perlu diperbaiki', render: (item) => item.missing_fields?.join(', ') || '-' },
  { label: 'Prioritas', render: (item) => qualityLabel(item.priority) },
  { label: 'Kontak (disamarkan)', render: (item) => [item.phone_display || '-', item.email_display || '-'] },
  { label: 'Diperbarui', render: (item) => formatQualityDateTime(item.source_updated_at) },
];

const TABLE_COLUMNS = {
  athletes: PROFILE_COLUMNS,
  coaches: PROFILE_COLUMNS,
  duplicates: [
    { label: 'Kandidat', render: (item) => [`#${item.id}`, item.title] },
    { label: 'Klasifikasi', render: (item) => qualityLabel(item.finding_type) },
    { label: 'Prioritas', render: (item) => qualityLabel(item.priority) },
    { label: 'Profil terkait', render: entityLines },
    { label: 'Alasan kecocokan', render: (item) => qualityLabel(parseQualityJSON(item.details, {}).signal) },
    { label: 'Status', render: (item) => qualityLabel(item.status) },
    { label: 'Organisasi / Cabor', render: organizationCabor },
    { label: 'Terakhir ditemukan', render: (item) => formatQualityDateTime(item.last_seen_at) },
  ],
  validity: [
    { label: 'Jenis masalah', render: (item) => qualityLabel(item.finding_type) },
    { label: 'Profil terkait', render: (item) => entityLines(item).join(', ') || entityLabel({ type: item.entity_type }) },
    { label: 'Prioritas', render: (item) => qualityLabel(item.priority) },
    { label: 'Judul', render: (item) => item.title },
    { label: 'Organisasi / Cabor', render: organizationCabor },
    { label: 'Terakhir terdeteksi', render: (item) => formatQualityDateTime(item.last_seen_at) },
  ],
  documents: [
    { label: 'Profil', render: (item) => [item.profile_name, `${qualityLabel(item.profile_type)} #${item.profile_id}`] },
    { label: 'Jenis dokumen', render: (item) => qualityLabel(item.document_type) },
    { label: 'Status', render: (item) => qualityLabel(item.status) },
    { label: 'Jenis file', render: (item) => item.detected_mime || '-' },
    { label: 'Masa berlaku', render: (item) => formatQualityDate(item.expires_at) },
    { label: 'Organisasi / Cabor', render: organizationCabor },
    { label: 'Diperiksa', render: (item) => formatQualityDateTime(item.checked_at) },
  ],
  distribution: [
    { label: 'Wilayah', render: (item) => item.region_name || '-' },
    { label: 'Organisasi', render: (item) => item.organization_name || '-' },
    { label: 'Pengcab', render: (item) => item.pengcab_name || '-' },
    { label: 'Cabor', render: (item) => item.cabor_name || '-' },
    { label: 'Profil', num: true, render: (item) => formatQualityNumber(item.profiles) },
    { label: 'Skor rata-rata', num: true, render: (item) => `${formatQualityScore(item.average_score)}%` },
    { label: 'Masalah', num: true, render: (item) => formatQualityNumber(item.issues) },
    { label: 'Hubungan dengan pengcab', render: (item) => (item.unmapped_pengcab ? 'Belum terhubung' : 'Terpetakan') },
  ],
};

function buildCell(column, item) {
  const value = column.render(item);
  const lines = Array.isArray(value) ? value : [value];
  return `<td${column.num ? ' class="num"' : ''}>${lines.map(escapePrintHtml).join('<br>')}</td>`;
}

function buildTable(columns, rows, emptyMessage = 'Tidak ada data.') {
  const head = columns.map((column) => `<th${column.num ? ' class="num"' : ''}>${escapePrintHtml(column.label)}</th>`).join('');
  const body = rows.length
    ? rows.map((item) => `<tr>${columns.map((column) => buildCell(column, item)).join('')}</tr>`).join('')
    : `<tr><td colspan="${columns.length}" class="empty-cell">${escapePrintHtml(emptyMessage)}</td></tr>`;
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function buildCountTable(title, entries) {
  return `<section class="section">
    <h3>${escapePrintHtml(title)}</h3>
    ${buildTable(
      [{ label: 'Nama', render: ([key]) => qualityLabel(key) }, { label: 'Jumlah', num: true, render: ([, value]) => formatQualityNumber(value) }],
      entries,
    )}
  </section>`;
}

function buildSummaryBody(data = {}) {
  const profileTypes = ['athlete', 'coach'].map((key) => [key, data.by_profile_type?.[key] || {}]);
  const kpis = [
    ['Total profil', formatQualityNumber(data.profiles_total)],
    ['Rata-rata kualitas data', `${formatQualityScore(data.average_score)}%`],
    ['Masalah belum selesai', formatQualityNumber(data.active_finding_count)],
    ['Perlu segera ditangani', formatQualityNumber(data.critical_count)],
  ];

  return `<div class="kpi-grid">${kpis.map(([label, value]) => `<article class="kpi-card"><div class="kpi-label">${escapePrintHtml(label)}</div><div class="kpi-value">${escapePrintHtml(value)}</div></article>`).join('')}</div>
  <section class="section">
    <h3>Profil menurut jenis</h3>
    ${buildTable([
    { label: 'Jenis', render: ([key]) => qualityLabel(key) },
    { label: 'Total', num: true, render: ([, value]) => formatQualityNumber(value.total) },
    { label: 'Skor rata-rata', num: true, render: ([, value]) => `${formatQualityScore(value.average_score)}%` },
    { label: 'Masalah', num: true, render: ([, value]) => formatQualityNumber(value.issues) },
  ], profileTypes)}
  </section>
  <div class="two-col">
    ${buildCountTable('Kategori kelengkapan', Object.entries(data.by_category || {}))}
    ${buildCountTable('Masalah menurut prioritas', Object.entries(data.by_priority || {}))}
  </div>
  ${buildCountTable('Jenis masalah yang perlu ditangani', Object.entries(data.by_finding_type || {}))}
  <section class="section">
    <h3>Perkembangan kualitas data</h3>
    ${buildTable([
    { label: 'Tanggal', render: (item) => formatQualityDate(item.date) },
    { label: 'Profil', render: (item) => qualityLabel(item.profile_type) },
    { label: 'Skor', num: true, render: (item) => `${formatQualityScore(item.average_score)}%` },
    { label: 'Jumlah', num: true, render: (item) => formatQualityNumber(item.profiles) },
  ], data.trend || [], 'Belum ada riwayat pemeriksaan untuk dibandingkan.')}
  </section>
  <section class="section">
    <h3>Peringkat kualitas data</h3>
    ${buildTable([
    { label: 'No.', num: true, render: (item) => formatQualityNumber(item.rank) },
    { label: 'Organisasi', render: (item) => item.organization_name || 'Tanpa organisasi' },
    { label: 'Cabor', render: (item) => item.cabor_name || 'Semua cabor' },
    { label: 'Profil', num: true, render: (item) => formatQualityNumber(item.profiles) },
    { label: 'Masalah', num: true, render: (item) => formatQualityNumber(item.issues) },
    { label: 'Skor', num: true, render: (item) => `${formatQualityScore(item.average_score)}%` },
  ], (data.rankings || []).map((item, index) => ({ ...item, rank: index + 1 })), 'Belum ada data peringkat untuk filter ini.')}
  </section>`;
}

function buildPrintHtml({ report, response, filters, filterOptions, printedAt }) {
  const metadata = response?.metadata;
  const pagination = report.key === 'summary' ? null : response?.pagination;
  const filterLabels = buildQualityFilterChips(report.key, filters, filterOptions).map(([, label]) => label);
  const rows = Array.isArray(response?.data) ? response.data : [];

  const meta = [
    ['Scan berhasil terakhir', formatQualityDateTime(metadata?.last_successful_scan?.finished_at || metadata?.last_successful_scan?.queued_at)],
    ['Snapshot', metadata?.snapshot_date ? formatQualityDate(metadata.snapshot_date) : 'Data terkini'],
    ['Scope', metadata?.scope?.breadcrumb?.join(' › ') || metadata?.scope?.label || 'Scope pengguna'],
    ['Laporan dicetak', formatQualityDateTime(printedAt)],
  ];
  if (pagination) {
    meta.push(['Halaman', `${formatQualityNumber(pagination.page)} dari ${formatQualityNumber(pagination.total_pages)}`]);
    meta.push(['Data pada halaman ini', `${formatQualityNumber(rows.length)} dari ${formatQualityNumber(pagination.total)}`]);
  }

  const body = report.key === 'summary'
    ? buildSummaryBody(response?.data)
    : `<section class="section">${buildTable(TABLE_COLUMNS[report.key] || [], rows)}</section>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapePrintHtml(report.title)} - KONI Sumatera Barat</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <header class="report-header">
    <div class="brand">KONI SUMATERA BARAT</div>
    <h1 class="report-title">${escapePrintHtml(report.title.toUpperCase())}</h1>
    <p class="report-subtitle">${escapePrintHtml(report.description)}</p>
    <div class="meta-grid">
      ${meta.map(([label, value]) => `<div class="meta-item"><span>${escapePrintHtml(label)}</span><strong>${escapePrintHtml(value)}</strong></div>`).join('')}
    </div>
    <p class="filter-note"><strong>Filter aktif:</strong> ${escapePrintHtml(filterLabels.length ? filterLabels.join(' · ') : 'Tidak ada filter')}</p>
  </header>
  ${body}
  <footer class="report-footer">
    Laporan mengikuti scope akses pengguna dan filter aktif saat dicetak. NIK, No. KK, telepon, dan email ditampilkan dalam bentuk disamarkan.${pagination ? ' Hanya data pada halaman yang sedang ditampilkan yang dicetak.' : ''}
  </footer>
</body>
</html>`;
}

function openPreparingWindow(title) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return null;
  printWindow.opener = null;
  printWindow.document.title = 'Menyiapkan laporan...';
  printWindow.document.body.innerHTML = `<p style="font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#475569">${escapePrintHtml(title)}</p>`;
  return printWindow;
}

function printAllErrorMessage(error) {
  if (error?.code === 'ERR_CANCELED') return '';
  if (error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '')) {
    return 'Waktu pembuatan laporan habis. Persempit filter lalu coba lagi, atau gunakan ekspor XLSX/CSV.';
  }
  const status = error?.response?.status;
  if (status === 403) return 'Anda tidak memiliki izin untuk mencetak seluruh hasil.';
  if (status === 422) return 'Jumlah data melebihi batas cetak. Persempit filter lalu coba lagi, atau gunakan ekspor XLSX/CSV.';
  if (status === 404) return 'Snapshot untuk laporan ini tidak tersedia.';
  if (status === 503) return 'Baseline laporan belum tersedia untuk dicetak.';
  if (!error?.response) return 'Gagal terhubung ke server. Periksa koneksi lalu coba lagi.';
  return 'Gagal menyiapkan seluruh hasil. Coba lagi atau gunakan ekspor XLSX/CSV.';
}

export function PrintDataQualityReport({ report, response, filters, filterOptions, disabled = false, canPrintAll = false }) {
  const [pageLoading, setPageLoading] = useState(false);
  const [allLoading, setAllLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pageInProgressRef = useRef(false);
  const allInProgressRef = useRef(false);
  const allControllerRef = useRef(null);
  const allPreviewWindowRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => () => {
    // A non-null controller means the print-all request is still in flight,
    // so the preview tab is still showing "Menyiapkan..." and is safe to
    // close. Once the request finishes the ref is cleared, so a tab that
    // already loaded the PDF is left alone even if this component unmounts.
    const requestInFlight = Boolean(allControllerRef.current);
    allControllerRef.current?.abort();
    if (requestInFlight && allPreviewWindowRef.current && !allPreviewWindowRef.current.closed) {
      allPreviewWindowRef.current.close();
    }
  }, []);

  const isPageDisabled = disabled || pageLoading || !response;
  const isAllDisabled = disabled || allLoading;

  const handlePrintPage = async () => {
    if (isPageDisabled || pageInProgressRef.current) return;

    pageInProgressRef.current = true;
    setPageLoading(true);
    let printWindow = null;

    try {
      printWindow = openPreparingWindow('Menyiapkan laporan untuk dicetak...');
      if (!printWindow) {
        window.alert('Popup cetak diblokir. Izinkan popup untuk mencetak laporan kualitas data.');
        return;
      }

      const html = buildPrintHtml({ report, response, filters, filterOptions, printedAt: new Date().toISOString() });
      await printProfileDocument(printWindow, html);
    } catch {
      if (printWindow && !printWindow.closed) printWindow.close();
      window.alert('Gagal menyiapkan laporan kualitas data. Silakan coba lagi.');
    } finally {
      pageInProgressRef.current = false;
      setPageLoading(false);
    }
  };

  const handlePrintAll = async () => {
    if (isAllDisabled || allInProgressRef.current) return;

    allControllerRef.current?.abort();
    const controller = new AbortController();
    allControllerRef.current = controller;
    allInProgressRef.current = true;
    setAllLoading(true);
    let previewWindow = null;
    let objectUrl = null;

    try {
      previewWindow = openPreparingWindow('Menyiapkan seluruh hasil untuk dicetak...');
      if (!previewWindow) {
        window.alert('Popup pratinjau diblokir. Izinkan popup untuk mencetak seluruh hasil.');
        return;
      }
      allPreviewWindowRef.current = previewWindow;

      const response = await requestQualityReportPrintAll(report.key, filters, controller.signal);
      if (previewWindow.closed) return;

      objectUrl = URL.createObjectURL(response.data);
      try {
        previewWindow.addEventListener('unload', () => {
          try { URL.revokeObjectURL(objectUrl); } catch { /* window already gone */ }
        });
      } catch { /* ignore listener failures, URL still gets cleaned up on reload/GC */ }
      previewWindow.location.href = objectUrl;
    } catch (error) {
      const message = printAllErrorMessage(error);
      if (!message) return;
      if (previewWindow && !previewWindow.closed) previewWindow.close();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      window.alert(message);
    } finally {
      allInProgressRef.current = false;
      setAllLoading(false);
      if (allControllerRef.current === controller) allControllerRef.current = null;
      if (allPreviewWindowRef.current === previewWindow) allPreviewWindowRef.current = null;
    }
  };

  if (report.key === 'summary') {
    return (
      <button
        type="button"
        onClick={handlePrintPage}
        disabled={isPageDisabled}
        aria-busy={pageLoading}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        title="Cetak laporan yang sedang ditampilkan"
      >
        {pageLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
        {pageLoading ? 'Menyiapkan...' : 'Cetak'}
      </button>
    );
  }

  const busy = pageLoading || allLoading;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        disabled={busy}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        className={`inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
          menuOpen ? 'border-red-200 text-red-600' : 'border-slate-200 text-slate-700 hover:border-red-200 hover:text-red-600'
        }`}
        title="Opsi cetak laporan"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
        Cetak
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
      </button>

      {menuOpen && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-xl">
          <button
            type="button"
            role="menuitem"
            disabled={isPageDisabled}
            onClick={() => { setMenuOpen(false); handlePrintPage(); }}
            className="flex w-full items-center gap-3 px-3.5 py-2 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="rounded-lg bg-slate-50 p-2 text-slate-600"><FileText className="h-4 w-4" /></span>
            <span>
              <p className="text-sm font-medium text-slate-800">Cetak halaman ini</p>
              <p className="text-xs text-slate-400">Data pada halaman yang sedang tampil</p>
            </span>
          </button>

          {canPrintAll && (
            <button
              type="button"
              role="menuitem"
              disabled={isAllDisabled}
              onClick={() => { setMenuOpen(false); handlePrintAll(); }}
              className="flex w-full items-center gap-3 px-3.5 py-2 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="rounded-lg bg-rose-50 p-2 text-rose-600"><Layers className="h-4 w-4" /></span>
              <span>
                <p className="text-sm font-medium text-slate-800">Cetak seluruh hasil</p>
                <p className="text-xs text-slate-400">Semua data sesuai filter aktif (PDF)</p>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
