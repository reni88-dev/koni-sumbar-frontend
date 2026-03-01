import { useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import api from '../api/axios';

/**
 * PrintCoachAthleteList — fetches ALL coach-athlete assignments (with current filters) and opens a print-friendly list.
 */
export function PrintCoachAthleteList({ filterParams, filters }) {
  const [loading, setLoading] = useState(false);

  const roleLabels = {
    head_coach: 'Pelatih Kepala',
    assistant_coach: 'Asisten Pelatih',
    specialist_coach: 'Pelatih Spesialis',
  };

  const handlePrint = async () => {
    setLoading(true);

    try {
      const params = { per_page: 9999, page: 1 };
      if (filterParams?.search) params.search = filterParams.search;
      if (filterParams?.cabor_id) params.cabor_id = filterParams.cabor_id;

      const response = await api.get('/api/coach-athletes', { params });
      const assignments = response.data?.data || [];

      const filterDesc = [];
      if (filters?.cabor) filterDesc.push(`Cabor: ${filters.cabor}`);
      if (filters?.search) filterDesc.push(`Pencarian: "${filters.search}"`);

      const now = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Data Pelatih & Atlet KONI Sumatera Barat</title>
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
    <h2>Data Pelatih & Atlet</h2>
    <div class="date">Dicetak pada: ${now}</div>
  </div>

  ${filterDesc.length > 0 ? `<div class="filters">Filter: ${filterDesc.join(' | ')}</div>` : ''}

  <div class="stats">
    <div class="stat-box">
      <div class="value">${assignments.length}</div>
      <div class="label">Total Assignment</div>
    </div>
    <div class="stat-box">
      <div class="value">${assignments.filter(a => a.is_active).length}</div>
      <div class="label">Aktif</div>
    </div>
    <div class="stat-box">
      <div class="value">${new Set(assignments.map(a => a.coach?.id)).size}</div>
      <div class="label">Pelatih</div>
    </div>
    <div class="stat-box">
      <div class="value">${new Set(assignments.map(a => a.athlete?.id)).size}</div>
      <div class="label">Atlet</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px; text-align:center;">No</th>
        <th>Pelatih</th>
        <th>Atlet</th>
        <th>Cabor</th>
        <th style="text-align:center;">Peran</th>
        <th style="text-align:center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${assignments.map((a, i) => `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td style="font-weight:500;">${a.coach?.name || '-'}</td>
        <td>${a.athlete?.name || '-'}</td>
        <td>${a.cabor?.name || '-'}</td>
        <td style="text-align:center;">${roleLabels[a.role] || a.role || '-'}</td>
        <td style="text-align:center;"><span class="badge ${a.is_active ? 'badge-active' : 'badge-inactive'}">${a.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">
    Data Pelatih & Atlet KONI Sumatera Barat — Total: ${assignments.length} assignment
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
      title="Cetak data pelatih & atlet"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
      <span>Cetak</span>
    </button>
  );
}
