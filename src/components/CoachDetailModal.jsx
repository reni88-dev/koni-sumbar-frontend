import { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User,
  Phone,
  Calendar,
  Trophy,
  Briefcase,
  Heart,
  Layers,
  Wallet,
  Printer,
  Loader2,
  Sparkles,
  ShieldCheck,
  Award,
  Medal,
  FileText,
  ExternalLink,
  Building2
} from 'lucide-react';
import api from '../api/axios';
import { ProtectedImage } from './ProtectedImage';
import { CoachClusterHistoryTab, CoachDevelopmentFundsTab } from './coach-clusters';

const genderLabels = { male: 'Laki-laki', female: 'Perempuan' };

function display(value) {
  if (value === null || value === undefined || value === '') return '-';
  return value;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(display(value))
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPrintRow(label, value) {
  return `
    <div class="info-row">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
    </div>`;
}

function formatPrintDate(dateStr) {
  return escapeHtml(formatDate(dateStr));
}

function parseAchievements(achievements) {
  if (!achievements) return [];
  if (Array.isArray(achievements)) {
    return achievements.map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return item.title || item.name || item.achievement || item.description || JSON.stringify(item);
      }
      return String(item);
    }).filter(Boolean);
  }
  if (typeof achievements === 'string') {
    const trimmed = achievements.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseAchievements(parsed);
      } catch {
        // Not JSON, continue to line split
      }
    }
    return trimmed.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  }
  return [String(achievements)];
}

function ProfileField({ label, value, mono = false, className = '', valueClassName = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-xs hover:border-slate-300 transition-colors ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`${mono ? 'font-mono' : ''} mt-1 text-sm font-semibold text-slate-800 break-words ${valueClassName}`}>
        {display(value)}
      </p>
    </div>
  );
}

function ProfileSection(props) {
  const { title, icon: Icon, iconColor = 'text-slate-600', iconBg = 'bg-slate-100', children } = props;
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
      <h3 className="mb-4 flex items-center gap-2.5 text-sm font-bold text-slate-800 pb-3 border-b border-slate-100">
        {Icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
            <Icon aria-hidden="true" className="w-4 h-4" />
          </span>
        )}
        <span>{title}</span>
      </h3>
      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function TabButton(props) {
  const { id, activeTab, onSelect, icon: Icon, badge, children } = props;
  const isActive = activeTab === id;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
        isActive
          ? 'bg-white text-red-700 shadow-sm ring-1 ring-red-100'
          : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      <span>{children}</span>
      {badge !== undefined && (
        <span
          className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
            isActive ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export function CoachDetailModal({ isOpen, onClose, coach }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isOpeningCertificate, setIsOpeningCertificate] = useState(false);

  if (!isOpen || !coach) return null;

  const organizationName = coach.organization?.name || coach.organization_name;
  const caborName = coach.cabor?.display_name || coach.cabor?.name;
  const currentCluster = coach.current_cluster_label || 'Pelatih Non Binaan';
  const currentSubCluster = coach.current_sub_cluster_label;
  const activeStatus = coach.is_active ? 'Aktif' : 'Nonaktif';
  const clusterBadgeText = currentSubCluster ? `${currentCluster} - ${currentSubCluster}` : currentCluster;
  const achievementsList = parseAchievements(coach.achievements);

  const handleOpenCertificate = async () => {
    if (!coach?.certificate_document || isOpeningCertificate) return;
    setIsOpeningCertificate(true);

    try {
      const response = await api.get(coach.certificate_document, {
        responseType: 'blob',
      });
      const objectUrl = window.URL.createObjectURL(response.data);
      const previewWindow = window.open(objectUrl, '_blank', 'noopener,noreferrer');
      if (!previewWindow) {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      console.error('Failed to open certificate document:', error);
      window.alert('Gagal membuka dokumen sertifikat. Silakan coba lagi.');
    } finally {
      setIsOpeningCertificate(false);
    }
  };

  const buildPrintHtml = ({ histories, funds, clusterError, fundsError }) => {
    const printedAt = new Date();
    const printedDate = printedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const printedTime = printedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    const totalFunds = funds.reduce((sum, fund) => sum + Number(fund.amount || 0), 0);
    const printAchievements = achievementsList.length > 0 ? achievementsList : ['-'];

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>PROFIL PELATIH KONI SUMATERA BARAT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 22px; font-size: 11px; line-height: 1.45; }
    .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 14px; margin-bottom: 16px; }
    .header h1 { font-size: 17px; color: #dc2626; margin-bottom: 2px; }
    .header h2 { font-size: 14px; font-weight: 600; margin-bottom: 0; }
    .summary { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 10px; margin-bottom: 14px; }
    .summary-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #f8fafc; }
    .summary-box .label { color: #64748b; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
    .summary-box .value { font-size: 12px; font-weight: 700; color: #0f172a; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
    .badge-active { background: #dcfce7; color: #15803d; }
    .badge-inactive { background: #f1f5f9; color: #64748b; }
    .section { margin-top: 14px; page-break-inside: avoid; }
    .section h3 { font-size: 12px; color: #dc2626; border-bottom: 1px solid #fee2e2; padding-bottom: 5px; margin-bottom: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .info-row { display: grid; grid-template-columns: 38% 62%; min-height: 28px; border-bottom: 1px solid #e2e8f0; }
    .info-row:nth-last-child(-n+2) { border-bottom: 0; }
    .info-row .label { background: #f8fafc; padding: 7px 9px; color: #64748b; font-weight: 600; }
    .info-row .value { padding: 7px 9px; font-weight: 500; word-break: break-word; }
    .full { grid-column: 1 / -1; }
    .full.info-row { grid-template-columns: 19% 81%; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; font-weight: 700; text-align: left; padding: 7px 8px; border: 1px solid #e2e8f0; font-size: 9px; text-transform: uppercase; color: #64748b; letter-spacing: 0.4px; }
    td { padding: 7px 8px; border: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) { background: #f8fafc; }
    .empty { padding: 10px; border: 1px dashed #cbd5e1; border-radius: 8px; color: #64748b; background: #f8fafc; }
    .warning { padding: 10px; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b; background: #fef2f2; }
    .total { margin-top: 8px; text-align: right; font-size: 12px; font-weight: 700; }
    .footer { margin-top: 22px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 9px; color: #64748b; }

    @media print {
      @page { margin: 12mm; }
      body { padding: 0; margin: 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PROFIL PELATIH</h1>
    <h2>KONI SUMATERA BARAT</h2>
  </div>

  <div class="summary">
    <div class="summary-box">
      <div class="label">Nama Pelatih</div>
      <div class="value">${escapeHtml(coach.name)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Cabang Olahraga</div>
      <div class="value">${escapeHtml(caborName)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Status</div>
      <div class="value"><span class="badge ${coach.is_active ? 'badge-active' : 'badge-inactive'}">${escapeHtml(activeStatus)}</span></div>
    </div>
    <div class="summary-box">
      <div class="label">Organisasi</div>
      <div class="value">${escapeHtml(organizationName)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Level Lisensi</div>
      <div class="value">${escapeHtml(coach.license_level)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Kluster Aktif</div>
      <div class="value">${escapeHtml(clusterBadgeText)}</div>
    </div>
  </div>

  <div class="section">
    <h3>Data Pribadi</h3>
    <div class="grid">
      ${renderPrintRow('Nama', coach.name)}
      ${renderPrintRow('Status Aktif', activeStatus)}
      ${renderPrintRow('NIK', coach.nik)}
      ${renderPrintRow('Jenis Kelamin', genderLabels[coach.gender] || coach.gender)}
      ${renderPrintRow('Tempat Lahir', coach.birth_place)}
      ${renderPrintRow('Tanggal Lahir', formatDate(coach.birth_date))}
      ${renderPrintRow('Agama', coach.religion)}
      <div class="full info-row"><div class="label">Alamat</div><div class="value">${escapeHtml(coach.address)}</div></div>
    </div>
  </div>

  <div class="section">
    <h3>Kepelatihan dan Lisensi</h3>
    <div class="grid">
      ${renderPrintRow('Cabang Olahraga', caborName)}
      ${renderPrintRow('Nomor Lisensi', coach.license_number)}
      ${renderPrintRow('Level Lisensi', coach.license_level)}
      ${renderPrintRow('Spesialisasi', coach.specialization)}
      ${renderPrintRow('Tahun Mulai Melatih', coach.coaching_start_year)}
      ${renderPrintRow('Organisasi', organizationName)}
      ${renderPrintRow('Kluster Aktif', currentCluster)}
      ${renderPrintRow('Sub-kluster Aktif', currentSubCluster)}
    </div>
  </div>

  <div class="section">
    <h3>Kontak</h3>
    <div class="grid">
      ${renderPrintRow('Telepon', coach.phone)}
      ${renderPrintRow('Email', coach.email)}
    </div>
  </div>

  <div class="section">
    <h3>Riwayat Prestasi Kepelatihan</h3>
    <div class="grid">
      <div class="full info-row"><div class="label">Prestasi</div><div class="value">${printAchievements.map((achievement) => escapeHtml(achievement)).join('<br>')}</div></div>
    </div>
  </div>

  <div class="section">
    <h3>Riwayat Kluster</h3>
    ${clusterError ? '<div class="warning">Riwayat kluster gagal dimuat.</div>' : histories.length === 0 ? '<div class="empty">Belum ada riwayat kluster.</div>' : `
      <table>
        <thead>
          <tr>
            <th>Periode</th>
            <th>Kluster</th>
            <th>Perubahan</th>
            <th>Alasan</th>
            <th>SK</th>
            <th>Dibuat Oleh</th>
          </tr>
        </thead>
        <tbody>
          ${histories.map((history) => `
            <tr>
              <td>${formatPrintDate(history.start_date)} - ${history.end_date ? formatPrintDate(history.end_date) : 'Sekarang'}</td>
              <td>${escapeHtml(history.sub_cluster_label ? `${history.cluster_label} - ${history.sub_cluster_label}` : history.cluster_label)}</td>
              <td>${escapeHtml(history.change_label || history.change_type)}</td>
              <td>${escapeHtml(history.reason)}</td>
              <td>${escapeHtml(history.decree?.decree_number)}<br>${formatPrintDate(history.decree?.decree_date)}</td>
              <td>${escapeHtml(history.created_by_user?.name)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`}
  </div>

  <div class="section">
    <h3>Dana Pembinaan</h3>
    ${fundsError ? '<div class="warning">Dana pembinaan gagal dimuat. Pastikan akun memiliki izin melihat dana pembinaan.</div>' : funds.length === 0 ? '<div class="empty">Belum ada dana pembinaan.</div>' : `
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Nominal</th>
            <th>Kluster</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${funds.map((fund) => `
            <tr>
              <td>${formatPrintDate(fund.fund_date)}</td>
              <td>${escapeHtml(formatCurrency(fund.amount))}</td>
              <td>${escapeHtml(fund.cluster_history?.sub_cluster_label || fund.cluster_history?.cluster_label)}</td>
              <td>${escapeHtml(fund.description)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="total">Total Dana Pembinaan: ${escapeHtml(formatCurrency(totalFunds))}</div>`}
  </div>

  <div class="footer">Dicetak oleh : KONI Sumbar pada tanggal ${escapeHtml(printedDate)} jam ${escapeHtml(printedTime)}</div>
</body>
</html>`;
  };

  const handlePrintDetail = async () => {
    setIsPrinting(true);

    try {
      const [clusterResult, fundResult] = await Promise.allSettled([
        api.get(`/api/coaches/${coach.id}/clusters`),
        api.get(`/api/coaches/${coach.id}/development-funds`, { params: { page: 1, per_page: 9999 } }),
      ]);

      const clusterError = clusterResult.status === 'rejected';
      const fundsError = fundResult.status === 'rejected';
      const histories = clusterResult.status === 'fulfilled' ? (clusterResult.value.data?.data || []) : [];
      const funds = fundResult.status === 'fulfilled' ? (fundResult.value.data?.data || []) : [];

      if (clusterError || fundsError) {
        console.error('Print detail data error:', {
          cluster: clusterError ? clusterResult.reason : null,
          funds: fundsError ? fundResult.reason : null,
        });
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        window.alert('Gagal membuka jendela cetak. Pastikan popup tidak diblokir browser.');
        return;
      }

      printWindow.document.write(buildPrintHtml({ histories, funds, clusterError, fundsError }));
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => printWindow.print(), 300);
      };
    } catch (error) {
      console.error('Print detail error:', error);
      window.alert('Gagal menyiapkan data cetak. Silakan coba lagi.');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <AnimatePresence>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50"
        onClick={onClose}
      />
      <Motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 pt-6 sm:p-6 sm:pt-10"
      >
        <div
          className="my-auto flex max-h-[calc(100vh-3.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl ring-1 ring-slate-900/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Executive Hero Header */}
          <div className="relative bg-gradient-to-br from-slate-950 via-red-950 to-red-700 text-white p-5 sm:p-7 overflow-hidden shrink-0">
            {/* Ambient Backlighting */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-red-500/20 blur-3xl" />
              <div className="absolute right-0 bottom-0 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
              <div className="absolute right-1/3 top-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
            </div>

            {/* Top Navigation Row: Subtitle Badge & Action Buttons */}
            <div className="relative flex items-center justify-between gap-3 mb-4 sm:mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-red-200">
                <ShieldCheck className="w-3.5 h-3.5 text-red-300" />
                <span>KONI SUMATERA BARAT &bull; DETAIL PELATIH</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintDetail}
                  disabled={isPrinting}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold border border-white/20 backdrop-blur-md transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  title="Cetak profil lengkap pelatih"
                >
                  {isPrinting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4 text-red-200" />
                  )}
                  <span className="hidden sm:inline">Cetak Profil</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all cursor-pointer"
                  title="Tutup (Esc)"
                  aria-label="Tutup modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Identity Profile Block */}
            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
              {/* Avatar with Status Ping Indicator */}
              <div className="relative shrink-0">
                <div className="h-22 w-22 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-2xl border-2 border-white/30 bg-slate-900/60 p-1 shadow-2xl backdrop-blur-xs ring-4 ring-white/10 overflow-hidden">
                  {coach.photo ? (
                    <ProtectedImage
                      src={coach.photo}
                      alt={coach.name}
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                      <User className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Status Dot / Badge */}
                <div className="absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md border ${
                      coach.is_active
                        ? 'bg-emerald-500 text-white border-emerald-300 ring-2 ring-emerald-950/50'
                        : 'bg-slate-700 text-slate-300 border-slate-500 ring-2 ring-slate-950/50'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        coach.is_active ? 'bg-white animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <span>{activeStatus}</span>
                  </span>
                </div>
              </div>

              {/* Main Info & Meta Tags */}
              <div className="flex-1 min-w-0 space-y-2.5">
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    {coach.name}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5 text-xs text-red-100/90 font-medium">
                    {coach.nik && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/25 backdrop-blur-md border border-white/10 font-mono">
                        <span>NIK:</span>
                        <strong className="text-white">{coach.nik}</strong>
                      </span>
                    )}
                    {coach.license_number && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/25 backdrop-blur-md border border-white/10 font-mono">
                        <span>No. Lisensi:</span>
                        <strong className="text-white">{coach.license_number}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Glassmorphic Category Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 pt-1">
                  {caborName && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-xs">
                      <Trophy className="w-3 h-3 text-amber-300 shrink-0" />
                      <span>{caborName}</span>
                    </span>
                  )}

                  {coach.license_level && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-xs">
                      <Award className="w-3 h-3 text-indigo-300 shrink-0" />
                      <span>{coach.license_level}</span>
                    </span>
                  )}

                  {currentCluster && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/20 backdrop-blur-md border border-amber-300/30 text-xs font-semibold text-amber-200 shadow-xs">
                      <Layers className="w-3 h-3 text-amber-300 shrink-0" />
                      <span>{clusterBadgeText}</span>
                    </span>
                  )}

                  {coach.specialization && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-400/20 backdrop-blur-md border border-emerald-300/30 text-xs font-semibold text-emerald-200 shadow-xs">
                      <Briefcase className="w-3 h-3 text-emerald-300 shrink-0" />
                      <span>{coach.specialization}</span>
                    </span>
                  )}

                  {organizationName && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/20 backdrop-blur-md border border-white/15 text-xs font-medium text-slate-200 shadow-xs">
                      <Building2 className="w-3 h-3 text-slate-300 shrink-0" />
                      <span>{organizationName}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Body & Tabs */}
          <div className="flex-1 overflow-y-auto bg-slate-50/80 p-4 sm:p-6 space-y-4">
            {/* Quick Metrics Bar (Key Highlights Strip) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {/* 1. TTL & Lahir */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TTL</p>
                  <p className="text-xs font-bold text-slate-800 truncate" title={`${coach.birth_place || '-'}, ${formatDate(coach.birth_date)}`}>
                    {coach.birth_place || '-'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{formatDate(coach.birth_date)}</p>
                </div>
              </div>

              {/* 2. Lisensi & Pengalaman */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lisensi & Karir</p>
                  <p className="text-xs font-bold text-slate-800 truncate" title={coach.license_level || '-'}>
                    {coach.license_level || 'Lisensi -'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Mulai: <strong className="text-slate-700">{coach.coaching_start_year || '-'}</strong>
                  </p>
                </div>
              </div>

              {/* 3. Kontak Utama */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kontak</p>
                  <p className="text-xs font-bold text-slate-800 truncate" title={coach.phone || '-'}>
                    {coach.phone || '-'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate" title={coach.email || '-'}>
                    {coach.email || '-'}
                  </p>
                </div>
              </div>

              {/* 4. Gender & Agama */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender & Agama</p>
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {genderLabels[coach.gender] || coach.gender || '-'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {coach.religion || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Navigation Controls */}
            <div className="flex flex-wrap sm:flex-nowrap gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
              <TabButton id="profile" activeTab={activeTab} onSelect={setActiveTab} icon={User}>
                Profil Lengkap
              </TabButton>
              <TabButton id="clusters" activeTab={activeTab} onSelect={setActiveTab} icon={Layers}>
                Riwayat Kluster
              </TabButton>
              <TabButton id="funds" activeTab={activeTab} onSelect={setActiveTab} icon={Wallet}>
                Dana Pembinaan
              </TabButton>
            </div>

            {/* Tab 1: Profil Lengkap */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                {/* 1. Identitas Pribadi */}
                <ProfileSection
                  title="Identitas Pribadi"
                  icon={User}
                  iconColor="text-blue-600"
                  iconBg="bg-blue-50"
                >
                  <ProfileField label="Nama Lengkap" value={coach.name} />
                  <ProfileField label="Status Keaktifan" value={activeStatus} />
                  <ProfileField label="NIK (Nomor Induk Kependudukan)" value={coach.nik} mono />
                  <ProfileField label="Jenis Kelamin" value={genderLabels[coach.gender] || coach.gender} />
                  <ProfileField label="Tempat Lahir" value={coach.birth_place} />
                  <ProfileField label="Tanggal Lahir" value={formatDate(coach.birth_date)} />
                  <ProfileField label="Agama" value={coach.religion} />
                  <ProfileField label="Alamat Domisili" value={coach.address} className="sm:col-span-2" />
                </ProfileSection>

                {/* 2. Kepelatihan & Lisensi */}
                <ProfileSection
                  title="Kepelatihan & Lisensi"
                  icon={Award}
                  iconColor="text-amber-600"
                  iconBg="bg-amber-50"
                >
                  <ProfileField label="Cabang Olahraga" value={caborName} />
                  <ProfileField label="Nomor Lisensi" value={coach.license_number} mono />
                  <ProfileField label="Level Lisensi" value={coach.license_level} />
                  <ProfileField label="Spesialisasi" value={coach.specialization} />
                  <ProfileField label="Tahun Mulai Melatih" value={coach.coaching_start_year} />
                  <ProfileField label="Organisasi / Pengcab" value={organizationName} />
                  <ProfileField label="Kluster Aktif" value={currentCluster} />
                  <ProfileField label="Sub-Kluster Aktif" value={currentSubCluster} />
                  {coach.certificate_document && (
                    <div className="sm:col-span-2 rounded-xl border border-blue-200/80 bg-blue-50/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 text-blue-900">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-950">Dokumen Sertifikat / Lisensi</p>
                          <p className="text-[11px] text-blue-700">Tersedia dokumen bukti fisik sertifikat pelatih</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenCertificate}
                        disabled={isOpeningCertificate}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isOpeningCertificate ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ExternalLink className="w-3.5 h-3.5" />
                        )}
                        <span>Buka Sertifikat</span>
                      </button>
                    </div>
                  )}
                </ProfileSection>

                {/* 3. Kontak & Komunikasi */}
                <ProfileSection
                  title="Kontak & Komunikasi"
                  icon={Phone}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                >
                  <ProfileField label="Nomor Telepon / WA" value={coach.phone} />
                  <ProfileField label="Alamat Email" value={coach.email} valueClassName="break-all" />
                </ProfileSection>

                {/* 4. Prestasi Kepelatihan */}
                <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-amber-100/30 p-4 sm:p-5 shadow-xs">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-950 pb-2 border-b border-amber-200/60">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-200/70 text-amber-800">
                      <Medal className="h-4 w-4" />
                    </span>
                    <span>Prestasi Kepelatihan</span>
                  </h3>
                  {achievementsList.length > 0 ? (
                    <ul className="space-y-2">
                      {achievementsList.map((achievement, i) => (
                        <li
                          key={`coach-achievement-${i}`}
                          className="flex items-start gap-2 rounded-xl border border-amber-200/80 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Belum ada riwayat prestasi yang dicatat.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Riwayat Kluster */}
            {activeTab === 'clusters' && <CoachClusterHistoryTab coach={coach} />}

            {/* Tab 3: Dana Pembinaan */}
            {activeTab === 'funds' && <CoachDevelopmentFundsTab coach={coach} />}
          </div>
        </div>
      </Motion.div>
    </AnimatePresence>
  );
}
