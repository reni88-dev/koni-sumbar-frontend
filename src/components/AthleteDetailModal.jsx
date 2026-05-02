import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Trophy,
  Activity,
  Briefcase,
  Heart,
  Droplet,
  Layers,
  Wallet,
  Printer,
  Loader2
} from 'lucide-react';
import api from '../api/axios';
import { ProtectedImage } from './ProtectedImage';
import { AthleteClusterHistoryTab, AthleteDevelopmentFundsTab } from './athlete-clusters';

const MotionDiv = motion.div;

export function AthleteDetailModal({ isOpen, onClose, athlete }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isPrinting, setIsPrinting] = useState(false);
  if (!isOpen || !athlete) return null;

  const genderLabels = { male: 'Laki-laki', female: 'Perempuan' };
  const maritalLabels = { single: 'Belum Menikah', married: 'Menikah', divorced: 'Cerai', widowed: 'Duda/Janda' };

  const display = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    return value;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));

  const escapeHtml = (value) => String(display(value))
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const renderPrintRow = (label, value) => `
    <div class="info-row">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
    </div>`;

  const formatPrintDate = (dateStr) => escapeHtml(formatDate(dateStr));

  const educationLevel = athlete.education_level?.name || athlete.education_level_name || athlete.education_level_id;
  const organizationName = athlete.organization?.name || athlete.organization_name;
  const competitionClassName = athlete.competition_class?.name || athlete.competition_class_name;
  const currentCluster = athlete.current_cluster_label || 'Atlet Non Binaan';
  const currentSubCluster = athlete.current_sub_cluster_label;
  const activeStatus = athlete.is_active ? 'Aktif' : 'Nonaktif';
  const topAchievements = (athlete.top_achievements || []).filter(Boolean);

  const badgeStyles = {
    sport: 'border-red-200 bg-red-50 text-red-700 ring-red-100',
    class: 'border-indigo-200 bg-indigo-50 text-indigo-700 ring-indigo-100',
    organization: 'border-slate-200 bg-white text-slate-700 ring-slate-100',
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-100',
    inactive: 'border-slate-200 bg-slate-100 text-slate-500 ring-slate-100',
    cluster: 'border-amber-200 bg-amber-50 text-amber-800 ring-amber-100',
  };

  const Badge = ({ children, variant = 'organization' }) => (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ring-1 ${badgeStyles[variant]}`}>
      {children}
    </span>
  );

  const ProfileField = ({ label, value, mono = false, className = '', valueClassName = '' }) => (
    <div className={`rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`${mono ? 'font-mono' : ''} mt-1 text-sm font-semibold text-slate-800 break-words ${valueClassName}`}>{display(value)}</p>
    </div>
  );

  const ProfileSection = ({ title, icon: Icon, iconClassName = 'text-slate-600', children }) => (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
            <Icon aria-hidden="true" className={`w-4 h-4 ${iconClassName}`} />
          </span>
        )}
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        {children}
      </div>
    </div>
  );

  const buildPrintHtml = ({ histories, funds, clusterError, fundsError }) => {
    const now = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const totalFunds = funds.reduce((sum, fund) => sum + Number(fund.amount || 0), 0);
    const printAchievements = topAchievements.length > 0 ? topAchievements : ['-'];

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Profil Atlet - ${escapeHtml(athlete.name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 22px; font-size: 11px; line-height: 1.45; }
    .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 14px; margin-bottom: 16px; }
    .header h1 { font-size: 17px; color: #dc2626; margin-bottom: 2px; }
    .header h2 { font-size: 14px; font-weight: 600; margin-bottom: 6px; }
    .date { font-size: 10px; color: #64748b; }
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
    .footer { margin-top: 22px; text-align: center; font-size: 9px; color: #94a3b8; }

    @media print {
      @page { margin: 12mm; }
      body { padding: 0; margin: 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>KONI SUMATERA BARAT</h1>
    <h2>Profil Atlet</h2>
    <div class="date">Dicetak pada: ${escapeHtml(now)}</div>
  </div>

  <div class="summary">
    <div class="summary-box">
      <div class="label">Nama Atlet</div>
      <div class="value">${escapeHtml(athlete.name)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Cabang Olahraga</div>
      <div class="value">${escapeHtml(athlete.cabor?.name)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Status</div>
      <div class="value"><span class="badge ${athlete.is_active ? 'badge-active' : 'badge-inactive'}">${escapeHtml(activeStatus)}</span></div>
    </div>
    <div class="summary-box">
      <div class="label">Organisasi</div>
      <div class="value">${escapeHtml(organizationName)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Kelas Pertandingan</div>
      <div class="value">${escapeHtml(competitionClassName)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Kluster Aktif</div>
      <div class="value">${escapeHtml(currentSubCluster ? `${currentCluster} - ${currentSubCluster}` : currentCluster)}</div>
    </div>
  </div>

  <div class="section">
    <h3>Data Pribadi</h3>
    <div class="grid">
      ${renderPrintRow('Nama', athlete.name)}
      ${renderPrintRow('Status Aktif', activeStatus)}
      ${renderPrintRow('NIK', athlete.nik)}
      ${renderPrintRow('No. Kartu Keluarga', athlete.no_kk)}
      ${renderPrintRow('No. Atlit Nasional', athlete.national_athlete_number)}
      ${renderPrintRow('Jenis Kelamin', genderLabels[athlete.gender])}
      ${renderPrintRow('Tempat Lahir', athlete.birth_place)}
      ${renderPrintRow('Tanggal Lahir', formatDate(athlete.birth_date))}
      ${renderPrintRow('Agama', athlete.religion)}
      ${renderPrintRow('Status Menikah', maritalLabels[athlete.marital_status])}
      <div class="full info-row"><div class="label">Alamat</div><div class="value">${escapeHtml(athlete.address)}</div></div>
    </div>
  </div>

  <div class="section">
    <h3>Olahraga dan Karir</h3>
    <div class="grid">
      ${renderPrintRow('Cabang Olahraga', athlete.cabor?.name)}
      ${renderPrintRow('Kelas Pertandingan', competitionClassName)}
      ${renderPrintRow('Organisasi', organizationName)}
      ${renderPrintRow('Tahun Mulai Karir', athlete.career_start_year)}
      ${renderPrintRow('Kluster Aktif', currentCluster)}
      ${renderPrintRow('Sub-kluster Aktif', currentSubCluster)}
    </div>
  </div>

  <div class="section">
    <h3>Fisik, Kontak, Pendidikan dan Pekerjaan</h3>
    <div class="grid">
      ${renderPrintRow('Tinggi Badan', athlete.height ? `${athlete.height} cm` : '-')}
      ${renderPrintRow('Berat Badan', athlete.weight ? `${athlete.weight} kg` : '-')}
      ${renderPrintRow('Golongan Darah', athlete.blood_type)}
      ${renderPrintRow('Pendidikan', educationLevel)}
      ${renderPrintRow('Telepon', athlete.phone)}
      ${renderPrintRow('Email', athlete.email)}
      ${renderPrintRow('Pekerjaan', athlete.occupation)}
      ${renderPrintRow('Hobi', athlete.hobby)}
    </div>
  </div>

  <div class="section">
    <h3>Orang Tua/Wali</h3>
    <div class="grid">
      ${renderPrintRow('Nama Ayah', athlete.father_name)}
      ${renderPrintRow('Telepon Ayah', athlete.father_phone)}
      ${renderPrintRow('Nama Ibu', athlete.mother_name)}
      ${renderPrintRow('Telepon Ibu', athlete.mother_phone)}
      <div class="full info-row"><div class="label">Alamat Orang Tua/Wali</div><div class="value">${escapeHtml(athlete.parent_address)}</div></div>
    </div>
  </div>

  <div class="section">
    <h3>Riwayat Prestasi dan Cedera</h3>
    <div class="grid">
      <div class="full info-row"><div class="label">Prestasi Tertinggi</div><div class="value">${printAchievements.map((achievement) => escapeHtml(achievement)).join('<br>')}</div></div>
      <div class="full info-row"><div class="label">Riwayat Cedera/Penyakit</div><div class="value">${escapeHtml(athlete.injury_illness_history)}</div></div>
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
    <h3>Biaya Pembinaan</h3>
    ${fundsError ? '<div class="warning">Biaya pembinaan gagal dimuat. Pastikan akun memiliki izin melihat biaya pembinaan.</div>' : funds.length === 0 ? '<div class="empty">Belum ada biaya pembinaan.</div>' : `
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
      <div class="total">Total Biaya Pembinaan: ${escapeHtml(formatCurrency(totalFunds))}</div>`}
  </div>

  <div class="footer">Profil Atlet KONI Sumatera Barat</div>
</body>
</html>`;
  };

  const handlePrintDetail = async () => {
    setIsPrinting(true);

    try {
      const [clusterResult, fundResult] = await Promise.allSettled([
        api.get(`/api/athletes/${athlete.id}/clusters`),
        api.get(`/api/athletes/${athlete.id}/development-funds`, { params: { page: 1, per_page: 9999 } }),
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

  const InfoItem = ({ icon: Icon, label, value, className = '' }) => (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className={`mt-1 text-sm font-semibold text-slate-800 break-words ${className}`}>{display(value)}</p>
        </div>
      </div>
    </div>
  );

  const TabButton = ({ id, icon: Icon, children }) => {
    const isActive = activeTab === id;

    return (
      <button
        type="button"
        onClick={() => setActiveTab(id)}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 sm:flex-none ${isActive ? 'bg-white text-red-700 shadow-sm ring-1 ring-red-100' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'}`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {children}
      </button>
    );
  };

  const clusterBadgeText = currentSubCluster ? `${currentCluster} - ${currentSubCluster}` : currentCluster;

  return (
    <AnimatePresence>
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <MotionDiv
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 pt-8 sm:p-6 sm:pt-12"
      >
        <div className="my-4 flex max-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl ring-1 ring-slate-900/10" onClick={e => e.stopPropagation()}>
          <div className="relative bg-gradient-to-br from-red-800 via-red-600 to-rose-500 px-5 pb-8 pt-5 text-white sm:px-7 sm:pb-9 sm:pt-6">
            <div className="absolute inset-0 overflow-hidden rounded-t-3xl">
              <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-20 right-10 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl" />
            </div>
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                <div className="shrink-0">
                  {athlete.photo ? (
                    <ProtectedImage
                      src={athlete.photo}
                      alt={athlete.name}
                      className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-xl ring-4 ring-white/25 sm:h-24 sm:w-24"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/95 shadow-xl ring-4 ring-white/25 sm:h-24 sm:w-24">
                      <User className="h-9 w-9 text-slate-400 sm:h-10 sm:w-10" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 pr-1 sm:pr-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Profil Atlet</p>
                  <h2 className="mt-1 text-2xl font-bold leading-tight text-white sm:text-3xl">{athlete.name}</h2>
                  <p className="mt-2 text-sm text-white/80">
                    {athlete.nik ? `NIK ${athlete.nik}` : `${display(athlete.birth_place)}, ${formatDate(athlete.birth_date)}`}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {athlete.cabor && <Badge variant="sport">{athlete.cabor.name}</Badge>}
                    {competitionClassName && <Badge variant="class">{competitionClassName}</Badge>}
                    {organizationName && <Badge variant="organization">{organizationName}</Badge>}
                    <Badge variant={athlete.is_active ? 'active' : 'inactive'}>{activeStatus}</Badge>
                    {currentCluster && <Badge variant="cluster">{clusterBadgeText}</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintDetail}
                  disabled={isPrinting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/15 px-3 text-sm font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60"
                  title="Cetak profil atlet"
                  aria-label="Cetak profil atlet"
                >
                  {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                  <span className="hidden sm:inline">Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Tutup modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/80 px-5 py-5 sm:px-7 sm:py-6">
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem icon={Calendar} label="TTL" value={`${athlete.birth_place || '-'}, ${formatDate(athlete.birth_date)}`} />
              <InfoItem icon={User} label="Gender" value={genderLabels[athlete.gender]} />
              <InfoItem icon={Heart} label="Status" value={maritalLabels[athlete.marital_status]} />
              <InfoItem icon={Droplet} label="Gol. Darah" value={athlete.blood_type} />
              <InfoItem icon={Activity} label="Tinggi/Berat" value={`${athlete.height || '-'} cm / ${athlete.weight || '-'} kg`} />
              <InfoItem icon={Briefcase} label="Pekerjaan" value={athlete.occupation} />
              <InfoItem icon={Phone} label="Telepon" value={athlete.phone} />
              <InfoItem icon={Mail} label="Email" value={athlete.email} className="break-all" />
              <InfoItem icon={MapPin} label="Alamat" value={athlete.address} />
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1.5 shadow-inner">
                <TabButton id="profile" icon={User}>Profil</TabButton>
                <TabButton id="clusters" icon={Layers}>Riwayat Kluster</TabButton>
                <TabButton id="funds" icon={Wallet}>Biaya Pembinaan</TabButton>
              </div>

              {activeTab === 'profile' && <div className="space-y-4">
              <ProfileSection title="Identitas" icon={User} iconClassName="text-blue-600">
                <ProfileField label="Nama" value={athlete.name} />
                <ProfileField label="Status Aktif" value={activeStatus} />
                <ProfileField label="NIK" value={athlete.nik} mono />
                <ProfileField label="No. Kartu Keluarga" value={athlete.no_kk} mono />
                <ProfileField label="No. Atlit Nasional" value={athlete.national_athlete_number} mono />
                <ProfileField label="Jenis Kelamin" value={genderLabels[athlete.gender]} />
                <ProfileField label="Tempat Lahir" value={athlete.birth_place} />
                <ProfileField label="Tanggal Lahir" value={formatDate(athlete.birth_date)} />
                <ProfileField label="Agama" value={athlete.religion} />
                <ProfileField label="Alamat" value={athlete.address} className="md:col-span-2" />
              </ProfileSection>

              <ProfileSection title="Olahraga dan Organisasi" icon={Layers} iconClassName="text-indigo-600">
                <ProfileField label="Cabang Olahraga" value={athlete.cabor?.name} />
                <ProfileField label="Kelas Pertandingan" value={competitionClassName} />
                <ProfileField label="Organisasi" value={organizationName} />
                <ProfileField label="Kluster Aktif" value={currentCluster} />
                <ProfileField label="Sub-kluster Aktif" value={currentSubCluster} />
                <ProfileField label="Tahun Mulai Karir" value={athlete.career_start_year} />
              </ProfileSection>

              <ProfileSection title="Fisik dan Kontak" icon={Activity} iconClassName="text-green-600">
                <ProfileField label="Tinggi Badan" value={athlete.height ? `${athlete.height} cm` : '-'} />
                <ProfileField label="Berat Badan" value={athlete.weight ? `${athlete.weight} kg` : '-'} />
                <ProfileField label="Golongan Darah" value={athlete.blood_type} />
                <ProfileField label="Telepon" value={athlete.phone} />
                <ProfileField label="Email" value={athlete.email} valueClassName="break-all" />
              </ProfileSection>

              <ProfileSection title="Pendidikan, Pekerjaan dan Pribadi" icon={Briefcase} iconClassName="text-slate-600">
                <ProfileField label="Pendidikan" value={educationLevel} />
                <ProfileField label="Pekerjaan" value={athlete.occupation} />
                <ProfileField label="Status Menikah" value={maritalLabels[athlete.marital_status]} />
                <ProfileField label="Hobi" value={athlete.hobby} />
              </ProfileSection>

              <ProfileSection title="Orang Tua/Wali" icon={Heart} iconClassName="text-rose-600">
                <ProfileField label="Nama Ayah" value={athlete.father_name} />
                <ProfileField label="Telepon Ayah" value={athlete.father_phone} />
                <ProfileField label="Nama Ibu" value={athlete.mother_name} />
                <ProfileField label="Telepon Ibu" value={athlete.mother_phone} />
                <ProfileField label="Alamat Orang Tua/Wali" value={athlete.parent_address} />
              </ProfileSection>

              <div className="rounded-2xl border border-amber-200/80 bg-amber-50 p-4 shadow-sm sm:p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100">
                    <Trophy className="h-4 w-4 text-amber-700" />
                  </span>
                  Prestasi Tertinggi
                </h3>
                {topAchievements.length > 0 ? (
                  <ul className="space-y-2">
                    {topAchievements.map((achievement, i) => (
                      <li key={`detail-achievement-${i}`} className="rounded-xl border border-amber-200/70 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700">{achievement}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">-</p>
                )}
              </div>

              <div className="rounded-2xl border border-rose-200/80 bg-rose-50 p-4 shadow-sm sm:p-5">
                <h3 className="mb-2 text-sm font-bold text-slate-900">Riwayat Cedera/Penyakit</h3>
                <p className="text-sm font-medium leading-relaxed text-slate-700">{display(athlete.injury_illness_history)}</p>
              </div>
              </div>}

              {activeTab === 'clusters' && <AthleteClusterHistoryTab athlete={athlete} />}
              {activeTab === 'funds' && <AthleteDevelopmentFundsTab athlete={athlete} />}
            </div>
          </div>
        </div>
      </MotionDiv>
    </AnimatePresence>
  );
}
