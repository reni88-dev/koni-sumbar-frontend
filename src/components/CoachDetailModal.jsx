import { useCallback, useEffect, useRef, useState } from 'react';
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
import { getCoachPhotoUrl } from '../lib/coachPhoto';
import { ProtectedImage } from './ProtectedImage';
import {
  openCoachProfilePrintWindow,
  parseCoachAchievements,
  printCoachProfile,
} from './coaches/coachProfilePrint';
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

function VerificationDocumentCard({ title, description, available, opening, onOpen, buttonLabel }) {
  return (
    <div className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
      available ? 'border-indigo-200/80 bg-indigo-50/50' : 'border-slate-200 bg-slate-50'
    }`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`p-2 rounded-lg shrink-0 ${
          available ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
        }`}>
          <FileText className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-bold ${available ? 'text-indigo-950' : 'text-slate-700'}`}>{title}</p>
          <p className={`text-[11px] ${available ? 'text-indigo-700' : 'text-slate-500'}`}>
            {available ? description : 'Dokumen belum tersedia pada data pelatih ini'}
          </p>
        </div>
      </div>
      {available && (
        <button
          type="button"
          onClick={onOpen}
          disabled={opening}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {opening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
          <span>{buttonLabel}</span>
        </button>
      )}
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

export function CoachDetailModal({ isOpen, onClose, coach, canViewSensitive = false }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isPrinting, setIsPrinting] = useState(false);
  const printingRef = useRef(false);
  const [openingDocument, setOpeningDocument] = useState('');
  const documentRequestIdRef = useRef(0);
  const documentControllerRef = useRef(null);
  const documentPreviewWindowRef = useRef(null);
  const documentObjectUrlsRef = useRef(new Set());

  const cleanupDocumentPreview = useCallback(() => {
    documentRequestIdRef.current += 1;
    documentControllerRef.current?.abort();
    documentControllerRef.current = null;
    documentPreviewWindowRef.current?.close();
    documentPreviewWindowRef.current = null;
    documentObjectUrlsRef.current.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    documentObjectUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    setOpeningDocument('');
    if (!isOpen) cleanupDocumentPreview();
    return cleanupDocumentPreview;
  }, [cleanupDocumentPreview, coach?.id, isOpen]);

  const handleOpenDocument = useCallback(async (kind, documentPath, label) => {
    if (!canViewSensitive || !documentPath || openingDocument) return;

    const requestId = ++documentRequestIdRef.current;
    documentControllerRef.current?.abort();
    const controller = new AbortController();
    documentControllerRef.current = controller;
    const previewWindow = window.open('', '_blank');
    documentPreviewWindowRef.current = previewWindow;
    if (previewWindow) {
      previewWindow.opener = null;
      previewWindow.document.title = `Memuat ${label}...`;
      previewWindow.document.body.textContent = `Memuat ${label}...`;
    }
    setOpeningDocument(kind);

    try {
      const response = await api.get(documentPath, {
        responseType: 'blob',
        signal: controller.signal
      });
      if (requestId !== documentRequestIdRef.current || controller.signal.aborted) {
        previewWindow?.close();
        return;
      }
      const objectUrl = URL.createObjectURL(response.data);
      documentObjectUrlsRef.current.add(objectUrl);
      if (previewWindow) {
        previewWindow.location.replace(objectUrl);
        documentPreviewWindowRef.current = null;
      } else {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      previewWindow?.close();
      if (
        requestId !== documentRequestIdRef.current ||
        error.name === 'CanceledError' ||
        error.code === 'ERR_CANCELED'
      ) {
        return;
      }
      const message = error.response?.status === 404
        ? `Dokumen ${label} tidak ditemukan.`
        : `Gagal membuka dokumen ${label}. Silakan coba lagi.`;
      window.alert(message);
    } finally {
      if (requestId === documentRequestIdRef.current) {
        documentControllerRef.current = null;
        documentPreviewWindowRef.current = null;
        setOpeningDocument('');
      }
    }
  }, [canViewSensitive, openingDocument]);

  if (!isOpen || !coach) return null;

  const organizationName = coach.organization?.name || coach.organization_name;
  const caborName = coach.cabor?.display_name || coach.cabor?.name;
  const currentCluster = coach.current_cluster_label || 'Pelatih Non Binaan';
  const currentSubCluster = coach.current_sub_cluster_label;
  const activeStatus = coach.is_active ? 'Aktif' : 'Nonaktif';
  const clusterBadgeText = currentSubCluster ? `${currentCluster} - ${currentSubCluster}` : currentCluster;
  const achievementsList = parseCoachAchievements(coach.achievements);
  const photoUrl = getCoachPhotoUrl(coach);

  const handlePrintDetail = async () => {
    if (!canViewSensitive || isPrinting || printingRef.current) return;

    printingRef.current = true;
    setIsPrinting(true);
    const printWindow = openCoachProfilePrintWindow();

    if (!printWindow) {
      printingRef.current = false;
      setIsPrinting(false);
      return;
    }

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

      await printCoachProfile(printWindow, {
        coach,
        histories,
        funds,
        clusterError,
        fundsError,
        photoUrl,
      });
    } catch (error) {
      console.error('Print detail error:', error);
      if (!printWindow.closed) printWindow.close();
      window.alert('Gagal menyiapkan data cetak. Silakan coba lagi.');
    } finally {
      printingRef.current = false;
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
                {canViewSensitive && (
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
                  {photoUrl ? (
                    <ProtectedImage
                      src={photoUrl}
                      alt={coach.name}
                      className="h-full w-full rounded-xl object-cover"
                      fallback={
                        <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                          <User className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300" />
                        </div>
                      }
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
                    {canViewSensitive && coach.nik && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/25 backdrop-blur-md border border-white/10 font-mono">
                        <span>NIK:</span>
                        <strong className="text-white">{coach.nik}</strong>
                      </span>
                    )}
                    {canViewSensitive && coach.license_number && (
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
            <div className={`grid grid-cols-2 gap-2.5 sm:gap-3 ${canViewSensitive ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
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
              {canViewSensitive && (
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
              )}

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
                  <ProfileField label="Nama Lengkap" value={coach.name} />
                  <ProfileField label="Status Keaktifan" value={activeStatus} />
                  {canViewSensitive && (
                    <ProfileField label="NIK (Nomor Induk Kependudukan)" value={coach.nik} mono />
                  )}
                  <ProfileField label="Jenis Kelamin" value={genderLabels[coach.gender] || coach.gender} />
                  <ProfileField label="Tempat Lahir" value={coach.birth_place} />
                  <ProfileField label="Tanggal Lahir" value={formatDate(coach.birth_date)} />
                  <ProfileField label="Agama" value={coach.religion} />
                  <ProfileField label="Alamat Domisili" value={coach.address} className="sm:col-span-2" />
                </ProfileSection>

                {/* 2. Dokumen Wajib Verifikasi */}
                {canViewSensitive && (
                  <ProfileSection
                    title="Dokumen Wajib Verifikasi"
                    icon={ShieldCheck}
                    iconColor="text-indigo-600"
                    iconBg="bg-indigo-50"
                  >
                    <VerificationDocumentCard
                      title="KTP Pelatih"
                      description="Dokumen identitas resmi tersedia untuk verifikasi"
                      available={Boolean(coach.identity_document)}
                      opening={openingDocument === 'identity'}
                      onOpen={() => handleOpenDocument('identity', coach.identity_document, 'KTP')}
                      buttonLabel="Buka KTP"
                    />
                    <VerificationDocumentCard
                      title="BPJS Kesehatan/Ketenagakerjaan"
                      description="Dokumen kepesertaan BPJS tersedia untuk verifikasi"
                      available={Boolean(coach.bpjs_document)}
                      opening={openingDocument === 'bpjs'}
                      onOpen={() => handleOpenDocument('bpjs', coach.bpjs_document, 'BPJS')}
                      buttonLabel="Buka BPJS"
                    />
                  </ProfileSection>
                )}

                {/* 3. Kepelatihan & Lisensi */}
                <ProfileSection
                  title="Kepelatihan & Lisensi"
                  icon={Award}
                  iconColor="text-amber-600"
                  iconBg="bg-amber-50"
                >
                  <ProfileField label="Cabang Olahraga" value={caborName} />
                  {canViewSensitive && (
                    <ProfileField label="Nomor Lisensi" value={coach.license_number} mono />
                  )}
                  <ProfileField label="Level Lisensi" value={coach.license_level} />
                  <ProfileField label="Spesialisasi" value={coach.specialization} />
                  <ProfileField label="Tahun Mulai Melatih" value={coach.coaching_start_year} />
                  <ProfileField label="Organisasi / Pengcab" value={organizationName} />
                  <ProfileField label="Kluster Aktif" value={currentCluster} />
                  <ProfileField label="Sub-Kluster Aktif" value={currentSubCluster} />
                  {canViewSensitive && coach.certificate_document && (
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
                        onClick={() => handleOpenDocument('certificate', coach.certificate_document, 'sertifikat')}
                        disabled={openingDocument === 'certificate'}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {openingDocument === 'certificate' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ExternalLink className="w-3.5 h-3.5" />
                        )}
                        <span>Buka Sertifikat</span>
                      </button>
                    </div>
                  )}
                </ProfileSection>

                {/* 4. Kontak & Komunikasi */}
                {canViewSensitive && (
                  <ProfileSection
                    title="Kontak & Komunikasi"
                    icon={Phone}
                    iconColor="text-emerald-600"
                    iconBg="bg-emerald-50"
                  >
                    <ProfileField label="Nomor Telepon / WA" value={coach.phone} />
                    <ProfileField label="Alamat Email" value={coach.email} valueClassName="break-all" />
                  </ProfileSection>
                )}

                {/* 5. Prestasi Kepelatihan */}
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

            {/* Tab 3: Biaya Pembinaan */}
            {activeTab === 'funds' && <CoachDevelopmentFundsTab coach={coach} onOpenClusterHistory={() => setActiveTab('clusters')} />}
          </div>
        </div>
      </Motion.div>
    </AnimatePresence>
  );
}
