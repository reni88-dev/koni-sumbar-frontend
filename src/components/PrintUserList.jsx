import { useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import api from '../api/axios';

/**
 * PrintUserList — fetches ALL users (with current filters) and opens a print-friendly list.
 */
export function PrintUserList({ filterParams, filters }) {
  const [loading, setLoading] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handlePrint = async () => {
    setLoading(true);

    try {
      const params = { per_page: 9999, page: 1 };
      if (filterParams?.search) params.search = filterParams.search;
      if (filterParams?.role_id) params.role_id = filterParams.role_id;

      const response = await api.get('/api/master/users', { params });
      const users = response.data?.data || [];

      const filterDesc = [];
      if (filters?.role) filterDesc.push(`Role: ${filters.role}`);
      if (filters?.search) filterDesc.push(`Pencarian: "${filters.search}"`);

      const now = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Data Pengguna KONI Sumatera Barat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 20px; font-size: 11px; }
    .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 14px; margin-bottom: 16px; }
    .header h1 { font-size: 16px; color: #dc2626; margin-bottom: 2px; }
    .header h2 { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
    .header .date { font-size: 10px; color: #64748b; }
    .filters { font-size: 10px; color: #64748b; text-align: center; margin-bottom: 12px; }

    .stats { display: flex; gap: 10px; margin-bottom: 14px; justify-content: center; }
    .stat-box { min-width: 150px; text-align: center; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .stat-box .value { font-size: 18px; font-weight: 700; }
    .stat-box .label { font-size: 9px; color: #64748b; margin-top: 2px; }

    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; font-weight: 600; text-align: left; padding: 7px 10px; border: 1px solid #e2e8f0; font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
    td { padding: 6px 10px; border: 1px solid #e2e8f0; font-size: 11px; }
    tr:nth-child(even) { background: #f8fafc; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; }
    .badge-role { background: #f1f5f9; color: #475569; }

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
    <h2>Data Pengguna Sistem (Users)</h2>
    <div class="date">Dicetak pada: ${now}</div>
  </div>

  ${filterDesc.length > 0 ? `<div class="filters">Filter: ${filterDesc.join(' | ')}</div>` : ''}

  <div class="stats">
    <div class="stat-box">
      <div class="value">${users.length}</div>
      <div class="label">Total Pengguna</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px; text-align:center;">No</th>
        <th>Nama Pengguna</th>
        <th>Email</th>
        <th>Role</th>
        <th>Terakhir Login</th>
        <th>Tanggal Dibuat</th>
      </tr>
    </thead>
    <tbody>
      ${users.map((u, i) => `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td style="font-weight:500;">${u.name || '-'}</td>
        <td>${u.email || '-'}</td>
        <td><span class="badge badge-role">${u.role?.name || '-'}</span></td>
        <td>${formatDate(u.last_login_at)}</td>
        <td>${formatDate(u.created_at)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">
    Data Pengguna KONI Sumatera Barat — Total: ${users.length} pengguna
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
      title="Cetak data pengguna"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
      <span>Cetak</span>
    </button>
  );
}
