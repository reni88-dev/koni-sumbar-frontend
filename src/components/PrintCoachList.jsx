import { useRef, useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { buildCoachListParams } from '../hooks/queries/listQueryParams';

const activeStatusLabels = {
  true: 'Aktif',
  false: 'Tidak Aktif',
  1: 'Aktif',
  0: 'Tidak Aktif',
};

const hasFilterValue = (value) =>
  value !== undefined && value !== null && value !== '';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * PrintCoachList — fetches ALL coaches (with current filters) and opens a print-friendly list.
 */
export function PrintCoachList({ filters, filterParams }) {
  const [loading, setLoading] = useState(false);
  const printInProgressRef = useRef(false);

  const handlePrint = async () => {
    if (printInProgressRef.current) return;

    printInProgressRef.current = true;
    setLoading(true);
    let printWindow = null;

    try {
      // Open synchronously from the click event so browsers do not block it
      // while the paginated requests are still running.
      printWindow = window.open('', '_blank');
      if (!printWindow) {
        window.alert('Popup cetak diblokir. Izinkan popup untuk mencetak data pelatih.');
        return;
      }

      printWindow.opener = null;
      printWindow.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Menyiapkan Data Pelatih</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; background: #f8fafc; }
    .status { text-align: center; padding: 32px; }
    .spinner { width: 36px; height: 36px; margin: 0 auto 16px; border: 4px solid #e2e8f0; border-top-color: #dc2626; border-radius: 999px; animation: spin 0.8s linear infinite; }
    h1 { margin: 0 0 8px; font-size: 20px; color: #0f172a; }
    p { margin: 0; font-size: 13px; color: #64748b; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="status">
    <div class="spinner" aria-hidden="true"></div>
    <h1>Menyiapkan data...</h1>
    <p>Mohon tunggu hingga seluruh data pelatih selesai dimuat.</p>
  </div>
</body>
</html>`);
      printWindow.document.close();

      const baseParams = buildCoachListParams({
        ...filterParams,
        page: null,
        perPage: 100,
      });

      const firstResponse = await api.get('/api/coaches', {
        params: { ...baseParams, page: 1 },
      });
      const firstPage = firstResponse.data;
      // /api/coaches returns total + per_page but no last_page.
      const total = Number(firstPage?.total);
      const perPage = Number(firstPage?.per_page);

      if (
        !Array.isArray(firstPage?.data) ||
        !Number.isInteger(total) || total < 0 ||
        !Number.isInteger(perPage) || perPage < 1
      ) {
        throw new Error('Invalid coach pagination response');
      }

      const lastPage = Math.max(1, Math.ceil(total / perPage));

      const coaches = [...firstPage.data];
      for (let page = 2; page <= lastPage; page += 1) {
        const response = await api.get('/api/coaches', {
          params: { ...baseParams, page },
        });
        const pageData = response.data?.data;

        if (!Array.isArray(pageData)) {
          throw new Error(`Invalid coach data on page ${page}`);
        }

        coaches.push(...pageData);
      }

      const filterDesc = [];
      if (filters?.cabor) filterDesc.push(`Cabor: ${filters.cabor}`);
      if (filters?.organization) filterDesc.push(`Organisasi: ${filters.organization}`);
      if (filters?.cluster) filterDesc.push(`Kluster: ${filters.cluster}`);
      if (filters?.subCluster) filterDesc.push(`Sub-Kluster: ${filters.subCluster}`);
      if (hasFilterValue(filterParams?.isActive)) {
        const activeStatus = filterParams.isActive;
        filterDesc.push(`Status: ${activeStatusLabels[activeStatus] || activeStatus}`);
      }
      if (filters?.search) filterDesc.push(`Pencarian: "${filters.search}"`);

      const now = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const activeCount = coaches.filter((c) => c.is_active).length;

      const clusterLabel = (coach) => {
        const clusterName = coach.active_cluster?.cluster?.name;
        if (!clusterName) return '-';
        const subName = coach.active_cluster?.sub_cluster?.name;
        return subName ? `${clusterName} - ${subName}` : clusterName;
      };

      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Data Pelatih KONI Sumatera Barat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 20px; font-size: 11px; }
    .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 14px; margin-bottom: 16px; }
    .header h1 { font-size: 16px; color: #dc2626; margin-bottom: 2px; }
    .header h2 { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
    .header .date { font-size: 10px; color: #64748b; }
    .filters { font-size: 10px; color: #64748b; text-align: center; margin-bottom: 12px; }

    .stats { display: flex; gap: 10px; margin-bottom: 14px; }
    .stat-box { flex: 1; text-align: center; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .stat-box .value { font-size: 18px; font-weight: 700; }
    .stat-box .label { font-size: 9px; color: #64748b; margin-top: 2px; }

    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; font-weight: 600; text-align: left; padding: 7px 10px; border: 1px solid #e2e8f0; font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
    td { padding: 6px 10px; border: 1px solid #e2e8f0; font-size: 11px; }
    tr:nth-child(even) { background: #f8fafc; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; }
    .badge-active { background: #dcfce7; color: #15803d; }
    .badge-inactive { background: #f1f5f9; color: #64748b; }

    .footer { margin-top: 24px; text-align: center; font-size: 9px; color: #94a3b8; }

    @media print {
      @page { margin: 12mm; }
      body { padding: 0; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>KONI SUMATERA BARAT</h1>
    <h2>Data Pelatih</h2>
    <div class="date">Dicetak pada: ${now}</div>
  </div>

  ${filterDesc.length > 0 ? `<div class="filters">Filter: ${escapeHtml(filterDesc.join(' | '))}</div>` : ''}

  <div class="stats">
    <div class="stat-box">
      <div class="value">${coaches.length}</div>
      <div class="label">Total Pelatih</div>
    </div>
    <div class="stat-box">
      <div class="value">${activeCount}</div>
      <div class="label">Aktif</div>
    </div>
    <div class="stat-box">
      <div class="value">${coaches.length - activeCount}</div>
      <div class="label">Tidak Aktif</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px; text-align:center;">No</th>
        <th>Nama Pelatih</th>
        <th>Cabor</th>
        <th>Lisensi</th>
        <th>Kluster</th>
        <th style="text-align:center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${coaches.map((c, i) => `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td style="font-weight:500;">${escapeHtml(c.name || '-')}</td>
        <td>${escapeHtml(c.cabor?.display_name || c.cabor?.name || '-')}</td>
        <td>${escapeHtml(c.license_level || '-')}</td>
        <td>${escapeHtml(clusterLabel(c))}</td>
        <td style="text-align:center;"><span class="badge ${c.is_active ? 'badge-active' : 'badge-inactive'}">${c.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">
    Data Pelatih KONI Sumatera Barat — Total: ${coaches.length} pelatih
  </div>
</body>
</html>`;

      if (printWindow.closed) {
        throw new Error('Print window was closed before the document was ready');
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        if (!printWindow.closed) printWindow.print();
      }, 300);
    } catch (err) {
      console.error('Print error:', err);
      if (printWindow && !printWindow.closed) printWindow.close();
      window.alert('Gagal menyiapkan seluruh data pelatih untuk dicetak. Silakan coba lagi.');
    } finally {
      printInProgressRef.current = false;
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={loading}
      className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
      title="Cetak daftar pelatih yang sesuai filter"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
      ) : (
        <Printer className="w-4 h-4 text-slate-600" />
      )}
      <span>{loading ? 'Menyiapkan...' : 'Cetak'}</span>
    </button>
  );
}
