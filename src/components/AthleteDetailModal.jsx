import { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
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
  Loader2,
  Sparkles,
  ShieldCheck,
  Medal,
  Award,
  FileText
} from 'lucide-react';
import api from '../api/axios';
import { useEducationLevelsAll } from '../hooks/queries/useMasterData';
import { ProtectedImage } from './ProtectedImage';
import { AthleteClusterHistoryTab, AthleteDevelopmentFundsTab } from './athlete-clusters';
import {
  openAthleteProfilePrintWindow,
  printAthleteProfile,
} from './athletes/athleteProfilePrint';

const genderLabels = { male: 'Laki-laki', female: 'Perempuan' };
const maritalLabels = { single: 'Belum Menikah', married: 'Menikah', divorced: 'Cerai', widowed: 'Duda/Janda' };

function display(value) {
  if (value === null || value === undefined || value === '') return '-';
  return value;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
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

export function AthleteDetailModal({ isOpen, onClose, athlete, canViewSensitive = false }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isPrinting, setIsPrinting] = useState(false);
  const { data: educationLevels = [] } = useEducationLevelsAll();
  if (!isOpen || !athlete) return null;

  const educationLevel = athlete.education_level?.name
    || athlete.education_level_name
    || educationLevels.find((level) => String(level.id) === String(athlete.education_level_id))?.name
    || '-';
  const organizationName = athlete.organization?.name || athlete.organization_name;
  const competitionClassName = athlete.competition_class?.name || athlete.competition_class_name;
  const caborName = athlete.cabor?.display_name || athlete.cabor?.name;
  const currentCluster = athlete.current_cluster_label || 'Atlet Non Binaan';
  const currentSubCluster = athlete.current_sub_cluster_label;
  const activeStatus = athlete.is_active ? 'Aktif' : 'Nonaktif';
  const topAchievements = (athlete.top_achievements || []).filter(Boolean);
  const clusterBadgeText = currentSubCluster ? `${currentCluster} - ${currentSubCluster}` : currentCluster;

  const handlePrintDetail = async () => {
    if (!canViewSensitive || isPrinting) return;

    setIsPrinting(true);
    const printWindow = openAthleteProfilePrintWindow();

    if (!printWindow) {
      setIsPrinting(false);
      return;
    }

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

      await printAthleteProfile(printWindow, {
        athlete,
        educationLevelName: educationLevel,
        histories,
        funds,
        clusterError,
        fundsError,
      });
    } catch (error) {
      console.error('Print detail error:', error);
      if (!printWindow.closed) printWindow.close();
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
                <span>KONI SUMATERA BARAT &bull; DETAIL ATLET</span>
              </div>

              <div className="flex items-center gap-2">
                {canViewSensitive && (
                  <button
                    type="button"
                    onClick={handlePrintDetail}
                    disabled={isPrinting}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold border border-white/20 backdrop-blur-md transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    title="Cetak profil lengkap atlet"
                  >
                    {isPrinting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Printer className="w-4 h-4 text-red-200" />
                    )}
                    <span className="hidden sm:inline">Cetak Profil</span>
                  </button>
                )}

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
                  {athlete.photo ? (
                    <ProtectedImage
                      src={athlete.photo}
                      alt={athlete.name}
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
                      athlete.is_active
                        ? 'bg-emerald-500 text-white border-emerald-300 ring-2 ring-emerald-950/50'
                        : 'bg-slate-700 text-slate-300 border-slate-500 ring-2 ring-slate-950/50'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        athlete.is_active ? 'bg-white animate-pulse' : 'bg-slate-400'
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
                    {athlete.name}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5 text-xs text-red-100/90 font-medium">
                    {canViewSensitive && athlete.nik && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/25 backdrop-blur-md border border-white/10 font-mono">
                        <span>NIK:</span>
                        <strong className="text-white">{athlete.nik}</strong>
                      </span>
                    )}
                    {athlete.national_athlete_number && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/25 backdrop-blur-md border border-white/10 font-mono">
                        <span>No. Nas:</span>
                        <strong className="text-white">{athlete.national_athlete_number}</strong>
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

                  {competitionClassName && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-xs">
                      <Award className="w-3 h-3 text-indigo-300 shrink-0" />
                      <span>{competitionClassName}</span>
                    </span>
                  )}

                  {currentCluster && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/20 backdrop-blur-md border border-amber-300/30 text-xs font-semibold text-amber-200 shadow-xs">
                      <Layers className="w-3 h-3 text-amber-300 shrink-0" />
                      <span>{clusterBadgeText}</span>
                    </span>
                  )}

                  {organizationName && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/20 backdrop-blur-md border border-white/15 text-xs font-medium text-slate-200 shadow-xs">
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
              {/* 1. TTL & Usia */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TTL</p>
                  <p className="text-xs font-bold text-slate-800 truncate" title={`${athlete.birth_place || '-'}, ${formatDate(athlete.birth_date)}`}>
                    {athlete.birth_place || '-'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{formatDate(athlete.birth_date)}</p>
                </div>
              </div>

              {/* 2. Fisik TB / BB */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fisik (TB / BB)</p>
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {athlete.height ? `${athlete.height} cm` : '-'} / {athlete.weight ? `${athlete.weight} kg` : '-'}
                  </p>
                  <p className="text-[11px] text-slate-500">Gol. Darah: <strong className="text-slate-700">{athlete.blood_type || '-'}</strong></p>
                </div>
              </div>

              {/* 3. Kontak Utama */}
              {canViewSensitive && (
                <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kontak</p>
                    <p className="text-xs font-bold text-slate-800 truncate" title={athlete.phone || '-'}>
                      {athlete.phone || '-'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate" title={athlete.email || '-'}>
                      {athlete.email || '-'}
                    </p>
                  </div>
                </div>
              )}

              {/* 4. Gender & Status */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status & Gender</p>
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {genderLabels[athlete.gender] || '-'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {maritalLabels[athlete.marital_status] || '-'}
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
                Biaya Pembinaan
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
                  <ProfileField label="Nama Lengkap" value={athlete.name} />
                  <ProfileField label="Status Keaktifan" value={activeStatus} />
                  {canViewSensitive && (
                    <>
                      <ProfileField label="NIK (Nomor Induk Kependudukan)" value={athlete.nik} mono />
                      <ProfileField label="Nomor Kartu Keluarga" value={athlete.no_kk} mono />
                    </>
                  )}
                  <ProfileField label="Nomor Atlit Nasional" value={athlete.national_athlete_number} mono />
                  <ProfileField label="Jenis Kelamin" value={genderLabels[athlete.gender]} />
                  <ProfileField label="Tempat Lahir" value={athlete.birth_place} />
                  <ProfileField label="Tanggal Lahir" value={formatDate(athlete.birth_date)} />
                  <ProfileField label="Agama" value={athlete.religion} />
                  <ProfileField label="Status Pernikahan" value={maritalLabels[athlete.marital_status]} />
                  <ProfileField label="Alamat Domisili" value={athlete.address} className="sm:col-span-2" />
                </ProfileSection>

                {/* 2. Cabang Olahraga & Organisasi */}
                <ProfileSection
                  title="Cabang Olahraga & Organisasi"
                  icon={Trophy}
                  iconColor="text-amber-600"
                  iconBg="bg-amber-50"
                >
                  <ProfileField label="Cabang Olahraga" value={caborName} />
                  <ProfileField label="Kelas Pertandingan" value={competitionClassName} />
                  <ProfileField label="Organisasi / Pengcab" value={organizationName} />
                  <ProfileField label="Tahun Mulai Karir" value={athlete.career_start_year} />
                  <ProfileField label="Kluster Aktif" value={currentCluster} />
                  <ProfileField label="Sub-Kluster Aktif" value={currentSubCluster} />
                </ProfileSection>

                {/* 3. Fisik, Kontak & Pendidikan */}
                <ProfileSection
                  title={canViewSensitive ? 'Fisik, Kontak & Pendidikan' : 'Fisik & Pendidikan'}
                  icon={Activity}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                >
                  <ProfileField label="Tinggi Badan" value={athlete.height ? `${athlete.height} cm` : '-'} />
                  <ProfileField label="Berat Badan" value={athlete.weight ? `${athlete.weight} kg` : '-'} />
                  <ProfileField label="Golongan Darah" value={athlete.blood_type} />
                  <ProfileField label="Pendidikan Terakhir" value={educationLevel} />
                  {canViewSensitive && (
                    <>
                      <ProfileField label="Nomor Telepon / WA" value={athlete.phone} />
                      <ProfileField label="Alamat Email" value={athlete.email} valueClassName="break-all" />
                    </>
                  )}
                  <ProfileField label="Pekerjaan" value={athlete.occupation} />
                  <ProfileField label="Hobi" value={athlete.hobby} />
                </ProfileSection>

                {/* 4. Orang Tua / Wali */}
                <ProfileSection
                  title="Data Orang Tua / Wali"
                  icon={Heart}
                  iconColor="text-rose-600"
                  iconBg="bg-rose-50"
                >
                  <ProfileField label="Nama Ayah" value={athlete.father_name} />
                  {canViewSensitive && <ProfileField label="Telepon Ayah" value={athlete.father_phone} />}
                  <ProfileField label="Nama Ibu" value={athlete.mother_name} />
                  {canViewSensitive && <ProfileField label="Telepon Ibu" value={athlete.mother_phone} />}
                  <ProfileField label="Alamat Orang Tua / Wali" value={athlete.parent_address} className="sm:col-span-2" />
                </ProfileSection>

                {/* 5. Prestasi Tertinggi & Medis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Prestasi */}
                  <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-amber-100/30 p-4 sm:p-5 shadow-xs">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-950 pb-2 border-b border-amber-200/60">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-200/70 text-amber-800">
                        <Medal className="h-4 w-4" />
                      </span>
                      <span>Prestasi Tertinggi</span>
                    </h3>
                    {topAchievements.length > 0 ? (
                      <ul className="space-y-2">
                        {topAchievements.map((achievement, i) => (
                          <li
                            key={`detail-achievement-${i}`}
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

                  {/* Riwayat Cedera */}
                  <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/70 to-rose-100/30 p-4 sm:p-5 shadow-xs">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-rose-950 pb-2 border-b border-rose-200/60">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-200/70 text-rose-800">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span>Riwayat Cedera & Medis</span>
                    </h3>
                    <div className="rounded-xl border border-rose-200/80 bg-white/90 p-3 text-xs font-medium leading-relaxed text-slate-700 shadow-2xs min-h-[5rem]">
                      {display(athlete.injury_illness_history)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Riwayat Kluster */}
            {activeTab === 'clusters' && <AthleteClusterHistoryTab athlete={athlete} />}

            {/* Tab 3: Biaya Pembinaan */}
            {activeTab === 'funds' && <AthleteDevelopmentFundsTab athlete={athlete} />}
          </div>
        </div>
      </Motion.div>
    </AnimatePresence>
  );
}
