import { useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import api from '../api/axios';

/**
 * PrintAthleteList — fetches ALL athletes (with current filters) and opens a print-friendly list.
 */
export function PrintAthleteList({ filters, filterParams, total }) {
  const [loading, setLoading] = useState(false);

  const genderLabels = { male: 'Laki-laki', female: 'Perempuan' };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handlePrint = async () => {
    setLoading(true);

    try {
      // Fetch ALL athletes with current filters (no pagination limit)
      const params = { per_page: 9999, page: 1 };
      if (filterParams?.search) params.search = filterParams.search;
      if (filterParams?.caborId) params.cabor_id = filterParams.caborId;
      if (filterParams?.gender) params.gender = filterParams.gender;
      if (filterParams?.organizationId) params.organization_id = filterParams.organizationId;

      const response = await api.get('/api/athletes', { params });
      const athletes = response.data?.data || [];

      const filterDesc = [];
      if (filters?.cabor) filterDesc.push(`Cabor: ${filters.cabor}`);
      if (filters?.gender) filterDesc.push(`Gender: ${genderLabels[filters.gender] || filters.gender}`);
      if (filters?.organization) filterDesc.push(`Organisasi: ${filters.organization}`);
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
        <td>${a.cabor?.name || '-'}</td>
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

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          setTimeout(() => printWindow.print(), 300);
        };
      }
    } catch (err) {
      console.error('Print error:', err);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
      title="Cetak data atlet"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
      <span>Cetak</span>
    </button>
  );
}
