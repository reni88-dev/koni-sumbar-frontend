import { useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const ATTENDANCE_STATUS_LABELS = {
  present: 'Hadir',
  absent: 'Tidak Hadir',
  sick: 'Sakit',
  permission: 'Izin',
};

const ATTENDANCE_STATUS_SYMBOLS = {
  present: '✓',
  absent: '✗',
  sick: 'S',
  permission: 'I',
};

/**
 * Pre-fetch an image from protected storage and return as base64 data URL.
 */
async function fetchImageAsBase64(src) {
  try {
    const response = await api.get(src, { responseType: 'blob' });
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(response.data);
    });
  } catch {
    return null;
  }
}

function formatTime(t) {
  if (!t) return '';
  if (t.includes('T')) {
    const match = t.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : t;
  }
  return t.substring(0, 5);
}

/**
 * PrintAttendanceReport — button that pre-fetches photos and opens a print-friendly report.
 */
export function PrintAttendanceReport({ session, attendanceData }) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);

    try {
      // Pre-fetch all training photos as base64
      const photoPromises = (session.photos || []).map(async (photo) => {
        const src = photo.photo_url.startsWith('http')
          ? null // skip external URLs for now
          : `/api/storage/${photo.photo_url}`;
        const dataUrl = src ? await fetchImageAsBase64(src) : photo.photo_url;
        return { ...photo, dataUrl };
      });

      const photos = await Promise.all(photoPromises);

      // Build attendance stats
      const stats = {
        total: attendanceData.length,
        present: attendanceData.filter(a => a.status === 'present').length,
        absent: attendanceData.filter(a => a.status === 'absent').length,
        sick: attendanceData.filter(a => a.status === 'sick').length,
        permission: attendanceData.filter(a => a.status === 'permission').length,
      };

      const trainingDate = new Date(session.training_date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      const timeRange = session.start_time
        ? `${formatTime(session.start_time)}${session.end_time ? ' - ' + formatTime(session.end_time) : ''}`
        : '';

      // Build print HTML
      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Kehadiran - ${session.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 24px; font-size: 12px; }
    .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { font-size: 18px; color: #dc2626; margin-bottom: 4px; }
    .header h2 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; color: #64748b; font-size: 11px; }
    .meta span { display: flex; align-items: center; gap: 4px; }

    .stats { display: flex; gap: 12px; margin: 16px 0; }
    .stat-box { flex: 1; text-align: center; padding: 10px 8px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .stat-box .value { font-size: 20px; font-weight: 700; }
    .stat-box .label { font-size: 10px; color: #64748b; margin-top: 2px; }
    .stat-hadir { background: #f0fdf4; color: #15803d; }
    .stat-sakit { background: #fefce8; color: #a16207; }
    .stat-izin { background: #eff6ff; color: #1d4ed8; }
    .stat-absen { background: #fef2f2; color: #dc2626; }

    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #f8fafc; font-weight: 600; text-align: left; padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 11px; }
    td { padding: 7px 12px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .status-present { color: #15803d; font-weight: 600; }
    .status-absent { color: #dc2626; font-weight: 600; }
    .status-sick { color: #a16207; font-weight: 600; }
    .status-permission { color: #1d4ed8; font-weight: 600; }

    .section-title { font-size: 14px; font-weight: 700; color: #334155; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
    .photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .photo-item { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; break-inside: avoid; }
    .photo-item img { width: 100%; height: 220px; object-fit: contain; display: block; background: #f1f5f9; }
    .photo-caption { padding: 6px 10px; font-size: 10px; color: #64748b; background: #f8fafc; }

    .footer { margin-top: 40px; display: flex; justify-content: space-between; }
    .signature { text-align: center; width: 200px; }
    .signature .line { border-top: 1px solid #1e293b; margin-top: 60px; padding-top: 4px; }

    @media print {
      @page { margin: 15mm; }
      body { padding: 0; margin: 0; }
      .photo-item { break-inside: avoid; }
      .photo-grid { break-before: auto; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>KONI SUMATERA BARAT</h1>
    <h2>${session.title}</h2>
    <div class="meta">
      <span>📅 ${trainingDate}</span>
      ${timeRange ? `<span>🕐 ${timeRange}</span>` : ''}
      <span>📍 ${session.location_name || '-'}</span>
      ${session.coach ? `<span>👤 ${session.coach.name}</span>` : ''}
      ${session.cabor ? `<span>🏅 ${session.cabor.name}</span>` : ''}
    </div>
  </div>

  <div class="section-title">Ringkasan Kehadiran</div>
  <div class="stats">
    <div class="stat-box stat-hadir"><div class="value">${stats.present}</div><div class="label">Hadir</div></div>
    <div class="stat-box stat-sakit"><div class="value">${stats.sick}</div><div class="label">Sakit</div></div>
    <div class="stat-box stat-izin"><div class="value">${stats.permission}</div><div class="label">Izin</div></div>
    <div class="stat-box stat-absen"><div class="value">${stats.absent}</div><div class="label">Tidak Hadir</div></div>
  </div>

  <div class="section-title">Daftar Kehadiran (${stats.total} Atlet)</div>
  <table>
    <thead>
      <tr>
        <th style="width:40px; text-align:center;">No</th>
        <th>Nama Atlet</th>
        <th style="width:100px; text-align:center;">Status</th>
        <th>Catatan</th>
      </tr>
    </thead>
    <tbody>
      ${attendanceData.map((a, i) => `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td>${a.athlete_name}</td>
        <td style="text-align:center;" class="status-${a.status}">${ATTENDANCE_STATUS_SYMBOLS[a.status] || ''} ${ATTENDANCE_STATUS_LABELS[a.status] || a.status}</td>
        <td>${a.notes || '-'}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  ${photos.length > 0 ? `
  <div class="section-title">Dokumentasi Latihan (${photos.length} Foto)</div>
  <div class="photo-grid">
    ${photos.map(p => `
    <div class="photo-item">
      ${p.dataUrl ? `<img src="${p.dataUrl}" alt="${p.caption || 'Foto latihan'}" />` : '<div style="height:200px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;">Foto tidak tersedia</div>'}
      ${p.caption ? `<div class="photo-caption">${p.caption}</div>` : ''}
    </div>`).join('')}
  </div>` : ''}

  <div class="footer">
    <div class="signature">
      <div class="line">Mengetahui</div>
    </div>
    <div class="signature">
      <div class="line">Pelatih${session.coach ? `<br/>${session.coach.name}` : ''}</div>
    </div>
  </div>
</body>
</html>`;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        // Wait for images to load before printing
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
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
      className="flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
      {loading ? 'Menyiapkan...' : 'Cetak'}
    </button>
  );
}
