import { useRef, useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import api from '../api/axios';

/**
 * PrintAthleteList — fetches ALL athletes (with current filters) and opens a print-friendly list.
 */
export function PrintAthleteList({ filters, filterParams }) {
  const [loading, setLoading] = useState(false);
  const printInProgressRef = useRef(false);

  const genderLabels = { male: 'Laki-laki', female: 'Perempuan' };
  const nationalNumberLabels = {
    true: 'Sudah Punya',
    false: 'Belum Punya',
    1: 'Sudah Punya',
    0: 'Belum Punya',
  };

  const hasFilterValue = (value) =>
    value !== undefined && value !== null && value !== '';

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

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
        window.alert('Popup cetak diblokir. Izinkan popup untuk mencetak data atlet.');
        return;
      }

      printWindow.opener = null;
      printWindow.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Menyiapkan Data Atlet</title>
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
    <p>Mohon tunggu hingga seluruh data atlet selesai dimuat.</p>
  </div>
</body>
</html>`);
      printWindow.document.close();

      const baseParams = { per_page: 100 };
      if (hasFilterValue(filterParams?.search)) baseParams.search = filterParams.search;
      if (hasFilterValue(filterParams?.caborId)) baseParams.cabor_id = filterParams.caborId;
      if (hasFilterValue(filterParams?.gender)) baseParams.gender = filterParams.gender;
      if (hasFilterValue(filterParams?.organizationId)) baseParams.organization_id = filterParams.organizationId;
      if (hasFilterValue(filterParams?.clusterId)) baseParams.cluster_id = filterParams.clusterId;
      if (hasFilterValue(filterParams?.subClusterId)) baseParams.sub_cluster_id = filterParams.subClusterId;
      if (hasFilterValue(filterParams?.hasNationalAthleteNumber)) {
        baseParams.has_national_athlete_number = filterParams.hasNationalAthleteNumber;
      }

      const firstResponse = await api.get('/api/athletes', {
        params: { ...baseParams, page: 1 },
      });
      const firstPage = firstResponse.data;
      const lastPage = Number(firstPage?.last_page);

      if (!Array.isArray(firstPage?.data) || !Number.isInteger(lastPage) || lastPage < 1) {
        throw new Error('Invalid athlete pagination response');
      }

      const athletes = [...firstPage.data];
      for (let page = 2; page <= lastPage; page += 1) {
        const response = await api.get('/api/athletes', {
          params: { ...baseParams, page },
        });
        const pageData = response.data?.data;

        if (!Array.isArray(pageData)) {
          throw new Error(`Invalid athlete data on page ${page}`);
        }

        athletes.push(...pageData);
      }

      const filterDesc = [];
      if (filters?.cabor) filterDesc.push(`Cabor: ${filters.cabor}`);
      if (filters?.gender) filterDesc.push(`Gender: ${genderLabels[filters.gender] || filters.gender}`);
      if (filters?.organization) filterDesc.push(`Organisasi: ${filters.organization}`);
      if (filters?.cluster) filterDesc.push(`Kluster: ${filters.cluster}`);
      if (filters?.subCluster) filterDesc.push(`Sub-Kluster: ${filters.subCluster}`);
      if (hasFilterValue(filterParams?.hasNationalAthleteNumber)) {
        const nationalNumberValue = filterParams.hasNationalAthleteNumber;
        filterDesc.push(
          `Nomor Atlet Nasional: ${nationalNumberLabels[nationalNumberValue] || nationalNumberValue}`,
        );
      }
      if (filters?.search) filterDesc.push(`Pencarian: "${filters.search}"`);

      const now = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Data Atlet KONI Sumatera Barat</title>
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
    .badge-male { background: #dbeafe; color: #1d4ed8; }
    .badge-female { background: #fce7f3; color: #be185d; }
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
    <h2>Data Atlet</h2>
    <div class="date">Dicetak pada: ${now}</div>
  </div>

  ${filterDesc.length > 0 ? `<div class="filters">Filter: ${filterDesc.join(' | ')}</div>` : ''}

  <div class="stats">
    <div class="stat-box">
      <div class="value">${athletes.length}</div>
      <div class="label">Total Atlet</div>
    </div>
    <div class="stat-box">
      <div class="value">${athletes.filter(a => a.gender === 'male').length}</div>
      <div class="label">Laki-laki</div>
    </div>
    <div class="stat-box">
      <div class="value">${athletes.filter(a => a.gender === 'female').length}</div>
      <div class="label">Perempuan</div>
    </div>
    <div class="stat-box">
      <div class="value">${athletes.filter(a => a.is_active).length}</div>
      <div class="label">Aktif</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px; text-align:center;">No</th>
        <th>Nama Atlet</th>
        <th>Cabor</th>
        <th>Tempat, Tanggal Lahir</th>
        <th style="text-align:center;">Gender</th>
        <th style="text-align:center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${athletes.map((a, i) => `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td style="font-weight:500;">${a.name || '-'}</td>
        <td>${a.cabor?.display_name || a.cabor?.name || '-'}</td>
        <td>${a.birth_place ? a.birth_place + ', ' : ''}${formatDate(a.birth_date)}</td>
        <td style="text-align:center;"><span class="badge ${a.gender === 'male' ? 'badge-male' : 'badge-female'}">${genderLabels[a.gender] || '-'}</span></td>
        <td style="text-align:center;"><span class="badge ${a.is_active ? 'badge-active' : 'badge-inactive'}">${a.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">
    Data Atlet KONI Sumatera Barat — Total: ${athletes.length} atlet
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
      window.alert('Gagal menyiapkan seluruh data atlet untuk dicetak. Silakan coba lagi.');
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
      title="Cetak daftar atlet yang sesuai filter"
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
