import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Edit2,
  FileText,
  Layers,
  Loader2,
  MapPin,
  Phone,
  Printer,
  Save,
  Trophy,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedImage } from '../components/ProtectedImage';
import {
  openCoachProfilePrintWindow,
  printCoachProfile,
} from '../components/coaches/coachProfilePrint';
import { CoachContactStep } from '../components/coach-form/CoachContactStep';
import { CoachLicenseCareerStep } from '../components/coach-form/CoachLicenseCareerStep';
import { CoachPersonalStep } from '../components/coach-form/CoachPersonalStep';
import { parseAchievementsForForm } from '../components/coach-form/coachFormModel';
import { COACH_PROFILE_FIELDS } from '../components/coach-form/coachProfileValidation';
import { useCoachFormController } from '../components/coach-form/useCoachFormController';
import { ProfileCompletionBanner } from '../components/form-validation/ProfileCompletionBanner';
import { ValidationSummary } from '../components/form-validation/ValidationSummary';
import {
  usePortalAthletes,
  usePortalCoachClusterHistories,
  usePortalCoachDevelopmentFunds,
  usePortalDashboard,
  usePortalEvents,
  usePortalProfile,
  useUpdatePortalProfile,
} from '../hooks/queries/usePortal';

const MotionDiv = motion.div;
const currentYear = new Date().getFullYear();
const GENDER_LABELS = { male: 'Laki-laki', female: 'Perempuan' };
const textOrDash = (value) => value || '-';
const formatDate = (value) => value ? new Date(value).toLocaleDateString('id-ID') : '-';
const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

function getCoach(profile) {
  if (profile?.coach) return profile.coach;

  const details = profile?.details || {};
  return {
    ...details,
    id: profile?.id ?? details.id,
    name: profile?.name ?? details.name,
    email: profile?.email ?? details.email,
    phone: profile?.phone ?? details.phone,
    photo: profile?.photo ?? details.photo,
    cabor_id: profile?.cabor_id ?? details.cabor_id,
    cabor: details.cabor || (profile?.cabor_id ? {
      id: profile.cabor_id,
      name: profile.cabor_name,
    } : null),
  };
}

function caborLabel(coach) {
  return coach?.cabor?.display_name || coach?.cabor?.name || '-';
}

function organizationLabel(coach) {
  return coach?.organization?.name || '-';
}

function InfoItem({ label, value }) {
  return (
    <div>
      <label className="text-xs text-slate-500 uppercase tracking-wider">{label}</label>
      <p className="text-slate-800 font-medium break-words">{textOrDash(value)}</p>
    </div>
  );
}

export function CoachPortal() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [fundYear, setFundYear] = useState(currentYear);
  const [isPrinting, setIsPrinting] = useState(false);
  const printingRef = useRef(false);

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = usePortalProfile();
  const profileReady = profile?.type === 'coach';
  const { data: events, isLoading: eventsLoading } = usePortalEvents({ enabled: profileReady });
  const { data: dashboard, isLoading: dashboardLoading } = usePortalDashboard({ enabled: profileReady });
  const { data: athletes, isLoading: athletesLoading } = usePortalAthletes({ enabled: profileReady });
  const {
    data: clustersData,
    isLoading: clustersLoading,
    isError: clustersError,
  } = usePortalCoachClusterHistories({ enabled: profileReady });
  const {
    data: fundsData,
    isLoading: fundsLoading,
    isError: fundsError,
  } = usePortalCoachDevelopmentFunds(
    { year: fundYear, perPage: 100 },
    { enabled: profileReady },
  );

  const coach = useMemo(() => getCoach(profile), [profile]);
  const clusters = clustersData?.data || [];
  const funds = fundsData?.data || [];
  const isPrintDataLoading = clustersLoading || fundsLoading;
  const isPrintBusy = isPrinting || isPrintDataLoading;
  const tabs = [
    { id: 'overview', label: 'Profil', icon: User },
    { id: 'clusters', label: 'Kluster', icon: Layers },
    { id: 'funds', label: 'Dana Pembinaan', icon: Wallet },
    { id: 'athletes', label: 'Atlet Saya', icon: Users },
    { id: 'events', label: 'Event', icon: Calendar },
  ];

  const handlePrint = async () => {
    if (isPrintBusy || printingRef.current) return;

    printingRef.current = true;
    setIsPrinting(true);
    const printWindow = openCoachProfilePrintWindow();

    if (!printWindow) {
      printingRef.current = false;
      setIsPrinting(false);
      return;
    }

    try {
      await printCoachProfile(printWindow, {
        coach,
        histories: clusters,
        funds,
        fundsTotalAmount: fundsData?.total_amount,
        clusterError: clustersError,
        fundsError,
        photoUrl: coach?.photo ? '/api/portal/profile/photo' : null,
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

  const handleCompleteProfile = () => {
    setActiveTab('overview');
    setIsEditing(true);
  };

  if (profileLoading || (profileReady && dashboardLoading)) {
    return (
      <DashboardLayout title="Portal Pelatih" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (profileError || !profileReady) {
    const isProvisioning = profileError?.response?.status === 404 || (!profileError && !profileReady);
    return (
      <DashboardLayout title="Portal Pelatih" subtitle="Status profil">
        <div className="max-w-xl mx-auto mt-12 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-600" />
          <h2 className="text-lg font-bold text-amber-900">
            {isProvisioning ? 'Profil pelatih belum terhubung' : 'Profil pelatih tidak dapat dimuat'}
          </h2>
          <p className="mt-2 text-sm text-amber-800">
            {isProvisioning
              ? 'Akun Anda sudah aktif, tetapi data pelatih masih dalam proses provisioning. Hubungi administrator KONI.'
              : 'Terjadi gangguan saat memuat profil. Silakan coba kembali.'}
          </p>
          {!isProvisioning && (
            <button
              type="button"
              onClick={() => refetchProfile()}
              className="mt-4 px-4 py-2 rounded-lg bg-amber-700 text-white hover:bg-amber-800"
            >
              Coba Lagi
            </button>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Portal Pelatih" subtitle={`Selamat datang, ${coach?.name || 'Pelatih'}!`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard color="from-blue-500 to-blue-600" label="Total Atlet" value={dashboard?.total_athletes || 0} icon={Users} />
        <StatCard color="from-green-500 to-green-600" label="Total Event" value={dashboard?.total_events || 0} icon={Calendar} delay={0.1} />
        <StatCard color="from-purple-500 to-purple-600" label="Event Mendatang" value={dashboard?.upcoming_events || 0} icon={Clock} delay={0.2} />
        <StatCard color="from-orange-500 to-red-500" label="Cabor" value={dashboard?.cabor_name || caborLabel(coach)} icon={Award} delay={0.3} small />
      </div>

      {profile?.profile_complete === false && (
        <ProfileCompletionBanner
          missingFields={profile.missing_fields || []}
          metadata={COACH_PROFILE_FIELDS}
          onComplete={handleCompleteProfile}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-max flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Profil Saya</h3>
                  <p className="text-sm text-slate-500">Data lengkap pelatih, afiliasi, domisili, lisensi, dan prestasi.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={isPrintBusy}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {isPrintBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    Cetak Profil
                  </button>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 sm:w-auto"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profil
                    </button>
                  )}
                </div>
              </div>

              {!isEditing ? (
                <CoachProfileView coach={coach} />
              ) : (
                <CoachProfileEditor
                  coach={coach}
                  onCancel={() => setIsEditing(false)}
                  onSuccess={() => setIsEditing(false)}
                  missingFields={profile.missing_fields || []}
                />
              )}
            </div>
          )}

          {activeTab === 'clusters' && <ClustersTab coach={coach} clusters={clusters} loading={clustersLoading} />}
          {activeTab === 'funds' && (
            <FundsTab
              funds={funds}
              fundsData={fundsData}
              loading={fundsLoading}
              year={fundYear}
              setYear={setFundYear}
            />
          )}
          {activeTab === 'athletes' && (
            <AthletesTab
              athletes={athletes}
              loading={athletesLoading}
              caborName={dashboard?.cabor_name || caborLabel(coach)}
            />
          )}
          {activeTab === 'events' && <EventsTab events={events} loading={eventsLoading} />}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ color, label, value, icon, delay = 0, small = false }) {
  const Icon = icon;
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-gradient-to-br ${color} text-white rounded-2xl p-5 shadow-lg`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white/80 text-sm">{label}</p>
          <p className={`${small ? 'text-xl truncate' : 'text-3xl'} font-bold`}>{value}</p>
        </div>
        <Icon className="w-10 h-10 opacity-80 flex-shrink-0" />
      </div>
    </MotionDiv>
  );
}

function CoachProfileView({ coach }) {
  const achievements = parseAchievementsForForm(coach?.achievements).filter(Boolean);
  const activeCluster = [coach?.current_cluster_label, coach?.current_sub_cluster_label]
    .filter(Boolean)
    .join(' - ') || 'Pelatih Non Binaan';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 rounded-2xl bg-slate-50 p-4 md:flex-row">
        <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {coach?.photo ? (
            <ProtectedImage src={coach.photo} alt={coach.name} className="h-full w-full object-cover" />
          ) : (
            <User className="h-12 w-12 text-slate-300" />
          )}
        </div>
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Nama Lengkap" value={coach?.name} />
          <InfoItem label="Cabang Olahraga" value={caborLabel(coach)} />
          <InfoItem label="Organisasi / Pengcab" value={organizationLabel(coach)} />
          <InfoItem label="Kluster Aktif (Read-only)" value={activeCluster} />
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Status (Read-only)</label>
            <p className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              coach?.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {coach?.is_active ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {coach?.is_active ? 'Aktif' : 'Tidak Aktif'}
            </p>
          </div>
        </div>
      </div>

      <Section title="Identitas" icon={User}>
        <InfoGrid items={[
          ['NIK', coach?.nik],
          ['Tempat Lahir', coach?.birth_place],
          ['Tanggal Lahir', formatDate(coach?.birth_date)],
          ['Jenis Kelamin', GENDER_LABELS[coach?.gender] || coach?.gender],
          ['Agama', coach?.religion],
        ]} />
      </Section>

      <Section title="Kontak & Domisili" icon={Phone}>
        <InfoGrid items={[
          ['Nomor WhatsApp', coach?.phone],
          ['Email', coach?.email],
          ['Alamat', coach?.address],
          ['Provinsi', coach?.province],
          ['Kota/Kabupaten', coach?.city],
          ['Kecamatan/Distrik', coach?.district],
          ['Kelurahan/Desa', coach?.village],
        ]} />
      </Section>

      <Section title="Lisensi & Karir" icon={Award}>
        <InfoGrid items={[
          ['Nomor Lisensi', coach?.license_number],
          ['Level Lisensi', coach?.license_level],
          ['Spesialisasi', coach?.specialization],
          ['Tahun Mulai Melatih', coach?.coaching_start_year],
        ]} />
      </Section>

      <Section title="Dokumen Tersimpan" icon={FileText}>
        <InfoGrid items={[
          ['KTP Pelatih', coach?.identity_document ? 'Tersimpan' : 'Belum tersedia'],
          ['Dokumen BPJS', coach?.bpjs_document ? 'Tersimpan' : 'Belum tersedia'],
          ['Sertifikat Kepelatihan', coach?.certificate_document ? 'Tersimpan' : 'Belum tersedia'],
        ]} />
      </Section>

      <Section title="Prestasi Kepelatihan" icon={Trophy}>
        {achievements.length ? (
          <ul className="list-disc space-y-1 pl-5 text-slate-700">
            {achievements.map((achievement, index) => <li key={`${index}-${achievement}`}>{achievement}</li>)}
          </ul>
        ) : (
          <p className="text-slate-500">Belum ada data prestasi.</p>
        )}
      </Section>
    </div>
  );
}

function Section({ title, icon, children }) {
  const Icon = icon;
  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <h4 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
        <Icon className="h-5 w-5 text-red-600" />
        {title}
      </h4>
      {children}
    </div>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => <InfoItem key={label} label={label} value={value} />)}
    </div>
  );
}

function CoachProfileEditor({ coach, onCancel, onSuccess, missingFields }) {
  const updateProfile = useUpdatePortalProfile();
  const controller = useCoachFormController({
    isOpen: true,
    coach,
    onSuccess,
    mode: 'portal',
    submitRequest: updateProfile.mutateAsync,
  });
  const { formContainerRef, validationSummaryRef, form, lookups, files, validation, submission } = controller;
  const isBusy = submission.loading || updateProfile.isPending || files.isAnyFileProcessing;
  const { navigateToError } = validation;

  useEffect(() => {
    if (missingFields?.[0]) navigateToError(missingFields[0]);
  }, [missingFields, navigateToError]);

  const handleSubmit = (event) => {
    event.preventDefault();
    submission.handleSubmit();
  };

  return (
    <form ref={formContainerRef} onSubmit={handleSubmit} className="space-y-5" aria-busy={isBusy}>
      <ValidationSummary
        ref={validationSummaryRef}
        errors={validation.errors}
        metadata={validation.metadata}
        onNavigate={validation.navigateToError}
      />
      {validation.errorMessage && Object.keys(validation.errors).length === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Profil belum dapat disimpan</p>
            <p>{validation.errorMessage}</p>
          </div>
        </div>
      )}

      <CoachPersonalStep form={form} lookups={lookups} files={files} validation={validation} />
      <CoachContactStep form={form} validation={validation} />
      <CoachLicenseCareerStep
        coach={coach}
        form={form}
        files={files}
        validation={validation}
        loading={submission.loading}
        showActiveStatus={false}
      />

      <div className="sticky bottom-3 z-10 flex flex-col-reverse gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-4 w-4" /> Batal
        </button>
        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {files.isAnyFileProcessing ? 'Memproses File...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  );
}

function ClustersTab({ coach, clusters, loading }) {
  const activeCluster = [coach?.current_cluster_label, coach?.current_sub_cluster_label]
    .filter(Boolean)
    .join(' - ') || 'Pelatih Non Binaan';
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800">Riwayat Kluster</h3>
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
        <p className="text-sm text-red-700">Kluster Aktif (Read-only)</p>
        <p className="text-xl font-bold text-red-900">{activeCluster}</p>
      </div>
      {loading ? <Loading /> : clusters.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-3">Kluster</th><th>Sub Kluster</th><th>Mulai</th><th>Selesai</th><th>Perubahan</th><th>Alasan</th>
              </tr>
            </thead>
            <tbody>
              {clusters.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-3 font-medium text-slate-800">{item.cluster_label}</td>
                  <td>{textOrDash(item.sub_cluster_label)}</td>
                  <td>{formatDate(item.start_date)}</td>
                  <td>{item.end_date ? formatDate(item.end_date) : <span className="font-medium text-green-700">Aktif</span>}</td>
                  <td>{item.change_label}</td>
                  <td>{textOrDash(item.reason)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty icon={Layers} text="Belum ada riwayat kluster" />}
    </div>
  );
}

function FundsTab({ funds, fundsData, loading, year, setYear }) {
  const totalAmount = fundsData?.total_amount || funds.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Dana Pembinaan</h3>
          <p className="text-sm text-slate-500">Data read-only milik akun pelatih ini.</p>
        </div>
        <input
          type="number"
          value={year}
          onChange={(event) => setYear(Number(event.target.value) || currentYear)}
          className="w-32 rounded-lg border border-slate-200 px-3 py-2"
        />
      </div>
      <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
        <p className="text-sm text-green-700">Total Tahun {year}</p>
        <p className="text-2xl font-bold text-green-900">{formatCurrency(totalAmount)}</p>
      </div>
      {loading ? <Loading /> : funds.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-3">Tanggal</th><th>Bulan</th><th>Nominal</th><th>Kluster</th><th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {funds.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-3">{formatDate(item.fund_date)}</td>
                  <td>{item.month}/{item.year}</td>
                  <td className="font-semibold text-slate-800">{formatCurrency(item.amount)}</td>
                  <td>{textOrDash(item.cluster_history?.sub_cluster_label || item.cluster_history?.cluster_label)}</td>
                  <td>{textOrDash(item.description)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty icon={Wallet} text="Belum ada data dana pembinaan" />}
    </div>
  );
}

function AthletesTab({ athletes, loading, caborName }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
        <h3 className="text-lg font-bold text-slate-800">Atlet Saya</h3>
        <span className="text-sm text-slate-500">{athletes?.length || 0} atlet di cabor {caborName}</span>
      </div>
      {loading ? <Loading /> : athletes?.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {athletes.map((athlete) => (
            <MotionDiv
              key={athlete.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 transition-colors hover:bg-slate-100"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100">
                {athlete.photo ? (
                  <img src={athlete.photo} alt={athlete.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-medium text-slate-800">{athlete.name}</h4>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  {athlete.gender && <span>{GENDER_LABELS[athlete.gender] || athlete.gender}</span>}
                  {athlete.birth_date && <span>• {formatDate(athlete.birth_date)}</span>}
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                athlete.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {athlete.is_active ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </MotionDiv>
          ))}
        </div>
      ) : <Empty icon={Users} text="Belum ada atlet terdaftar di cabor ini" />}
    </div>
  );
}

function EventsTab({ events, loading }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800">Event Cabor</h3>
      {loading ? <Loading /> : events?.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => (
            <MotionDiv
              key={event.event_key || `${event.source || 'legacy'}:${event.id}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 transition-colors hover:bg-slate-100"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-100">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-medium text-slate-800">{event.name}</h4>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                  {event.start_date && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(event.start_date)}</span>}
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                event.status === 'active' ? 'bg-green-100 text-green-700'
                  : event.status === 'upcoming' ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
              }`}>
                {event.status}
              </span>
            </MotionDiv>
          ))}
        </div>
      ) : <Empty icon={Calendar} text="Belum ada event untuk cabor ini" />}
    </div>
  );
}

function Loading() {
  return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-red-600" /></div>;
}

function Empty({ icon, text }) {
  const Icon = icon;
  return (
    <div className="py-12 text-center text-slate-400">
      <Icon className="mx-auto mb-3 h-12 w-12 opacity-50" />
      <p>{text}</p>
    </div>
  );
}
