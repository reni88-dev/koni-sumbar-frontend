import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Calendar, FileText, Award, MapPin, Clock,
  Loader2, Edit2, Save, X, CheckCircle, AlertCircle,
  Layers, Wallet, Printer, GraduationCap, Users, HeartPulse
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedImage } from '../components/ProtectedImage';
import {
  openAthleteProfilePrintWindow,
  printAthleteProfile,
} from '../components/athletes/athleteProfilePrint';
import { AthleteCareerStep } from '../components/athlete-form/AthleteCareerStep';
import { AthleteParentsStep } from '../components/athlete-form/AthleteParentsStep';
import { AthletePersonalStep } from '../components/athlete-form/AthletePersonalStep';
import { AthletePhysicalContactStep } from '../components/athlete-form/AthletePhysicalContactStep';
import { ATHLETE_PROFILE_FIELDS } from '../components/athlete-form/athleteProfileValidation';
import { useAthleteFormController } from '../components/athlete-form/useAthleteFormController';
import { ProfileCompletionBanner } from '../components/form-validation/ProfileCompletionBanner';
import { ValidationSummary } from '../components/form-validation/ValidationSummary';
import {
  usePortalProfile,
  usePortalEvents,
  usePortalSubmissions,
  usePortalDashboard,
  useUpdatePortalProfile,
  usePortalClusterHistories,
  usePortalDevelopmentFunds,
} from '../hooks/queries/usePortal';
import { useEducationLevelsAll } from '../hooks/queries/useMasterData';

const MotionDiv = motion.div;
const currentYear = new Date().getFullYear();
const GENDER_LABELS = { male: 'Laki-laki', female: 'Perempuan' };
const textOrDash = (value) => value || '-';
const caborLabel = (cabor) => cabor?.display_name || cabor?.name || '-';
const formatDate = (value) => value ? new Date(value).toLocaleDateString('id-ID') : '-';
const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));

function getAthlete(profile) {
  return profile?.athlete || {
    id: profile?.id,
    name: profile?.name,
    email: profile?.email,
    phone: profile?.phone,
    photo: profile?.photo,
    cabor_id: profile?.cabor_id,
    cabor: profile?.cabor_id ? { id: profile.cabor_id, name: profile.cabor_name } : null,
    ...profile?.details,
  };
}

function InfoItem({ label, value }) {
  return (
    <div>
      <label className="text-xs text-slate-500 uppercase tracking-wider">{label}</label>
      <p className="text-slate-800 font-medium break-words">{textOrDash(value)}</p>
    </div>
  );
}

export function AthletePortal() {
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
  const profileReady = profile?.type === 'athlete';
  const { data: events, isLoading: eventsLoading } = usePortalEvents({ enabled: profileReady });
  const { data: submissions, isLoading: submissionsLoading } = usePortalSubmissions({ enabled: profileReady });
  const { data: dashboard, isLoading: dashboardLoading } = usePortalDashboard({ enabled: profileReady });
  const {
    data: clustersData,
    isLoading: clustersLoading,
    isError: clustersError,
  } = usePortalClusterHistories({ enabled: profileReady });
  const {
    data: fundsData,
    isLoading: fundsLoading,
    isError: fundsError,
  } = usePortalDevelopmentFunds(
    { year: fundYear, perPage: 100 },
    { enabled: profileReady },
  );
  const { data: educationLevels = [], isLoading: educationLevelsLoading } = useEducationLevelsAll();

  const athlete = useMemo(() => getAthlete(profile), [profile]);
  const clusters = clustersData?.data || [];
  const funds = fundsData?.data || [];
  const educationLevelName = athlete?.education_level?.name
    || athlete?.education_level_name
    || educationLevels.find((level) => String(level.id) === String(athlete?.education_level_id))?.name
    || '-';
  const isPrintDataLoading = clustersLoading || fundsLoading || educationLevelsLoading;
  const isPrintBusy = isPrinting || isPrintDataLoading;

  const tabs = [
    { id: 'overview', label: 'Profil', icon: User },
    { id: 'clusters', label: 'Kluster', icon: Layers },
    { id: 'funds', label: 'Uang Pembinaan', icon: Wallet },
    { id: 'events', label: 'Event Saya', icon: Calendar },
    { id: 'submissions', label: 'Form Submission', icon: FileText },
  ];

  const handleEditStart = () => setIsEditing(true);
  const handleCompleteProfile = () => {
    setActiveTab('overview');
    setIsEditing(true);
  };

  const handlePrint = async () => {
    if (isPrintBusy || printingRef.current) return;

    printingRef.current = true;
    setIsPrinting(true);
    const printWindow = openAthleteProfilePrintWindow();

    if (!printWindow) {
      printingRef.current = false;
      setIsPrinting(false);
      return;
    }

    try {
      await printAthleteProfile(printWindow, {
        athlete,
        educationLevelName,
        histories: clusters,
        funds,
        fundsTotalAmount: fundsData?.total_amount,
        clusterError: clustersError,
        fundsError,
        photoUrl: athlete?.photo ? '/api/portal/profile/photo' : null,
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

  if (profileLoading || (profileReady && dashboardLoading)) {
    return (
      <DashboardLayout title="Portal Atlet" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (profileError || !profileReady) {
    const isProvisioning = profileError?.response?.status === 404 || (!profileError && !profileReady);
    return (
      <DashboardLayout title="Portal Atlet" subtitle="Status profil">
        <div className="max-w-xl mx-auto mt-12 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-600" />
          <h2 className="text-lg font-bold text-amber-900">
            {isProvisioning ? 'Profil atlet belum terhubung' : 'Profil atlet tidak dapat dimuat'}
          </h2>
          <p className="mt-2 text-sm text-amber-800">
            {isProvisioning
              ? 'Akun Anda sudah aktif, tetapi data atlet masih dalam proses provisioning. Hubungi administrator KONI.'
              : 'Terjadi gangguan saat memuat profil. Silakan coba kembali.'}
          </p>
          {!isProvisioning && (
            <button type="button" onClick={() => refetchProfile()} className="mt-4 px-4 py-2 rounded-lg bg-amber-700 text-white hover:bg-amber-800">
              Coba Lagi
            </button>
          )}
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout title="Portal Atlet" subtitle={`Selamat datang, ${profile?.name || 'Atlet'}!`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard color="from-blue-500 to-blue-600" label="Total Event" value={dashboard?.total_events || 0} icon={Calendar} />
        <StatCard color="from-green-500 to-green-600" label="Event Mendatang" value={dashboard?.upcoming_events || 0} icon={Clock} delay={0.1} />
        <StatCard color="from-purple-500 to-purple-600" label="Form Terisi" value={dashboard?.total_submissions || 0} icon={FileText} delay={0.2} />
        <StatCard color="from-orange-500 to-red-500" label="Cabor" value={dashboard?.cabor_name || '-'} icon={Award} delay={0.3} small />
      </div>

      {profile?.profile_complete === false && (
        <ProfileCompletionBanner
          missingFields={profile.missing_fields || []}
          metadata={ATHLETE_PROFILE_FIELDS}
          onComplete={handleCompleteProfile}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-100">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`min-w-max flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Profil Saya</h3>
                  <p className="text-sm text-slate-500">Data lengkap atlet, kontak, pendidikan, dan keluarga.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={isPrintBusy}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPrintBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    Cetak Profil
                  </button>
                  {!isEditing && (
                    <button onClick={handleEditStart} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" /> Edit Profil
                    </button>
                  )}
                </div>
              </div>

              {!isEditing ? (
                <ProfileView athlete={athlete} educationLevels={educationLevels} />
              ) : (
                <AthleteProfileEditor
                  athlete={athlete}
                  onCancel={() => setIsEditing(false)}
                  onSuccess={() => setIsEditing(false)}
                  missingFields={profile.missing_fields || []}
                />
              )}
            </div>
          )}

          {activeTab === 'clusters' && <ClustersTab athlete={athlete} clusters={clusters} loading={clustersLoading} />}
          {activeTab === 'funds' && <FundsTab funds={funds} fundsData={fundsData} loading={fundsLoading} year={fundYear} setYear={setFundYear} />}
          {activeTab === 'events' && <EventsTab events={events} loading={eventsLoading} />}
          {activeTab === 'submissions' && <SubmissionsTab submissions={submissions} loading={submissionsLoading} />}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ color, label, value, icon, delay = 0, small = false }) {
  const Icon = icon;
  return (
    <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={`bg-gradient-to-br ${color} text-white rounded-2xl p-5 shadow-lg`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0"><p className="text-white/80 text-sm">{label}</p><p className={`${small ? 'text-xl truncate' : 'text-3xl'} font-bold`}>{value}</p></div>
        <Icon className="w-10 h-10 opacity-80 flex-shrink-0" />
      </div>
    </MotionDiv>
  );
}

function ProfileView({ athlete, educationLevels }) {
  const educationLevelName = educationLevels.find((level) => String(level.id) === String(athlete?.education_level_id))?.name;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 p-4 bg-slate-50 rounded-2xl">
        <div className="w-28 h-28 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
          {athlete?.photo ? <ProtectedImage src={athlete.photo} alt={athlete.name} className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-slate-300" />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <InfoItem label="Nama Lengkap" value={athlete?.name} />
          <InfoItem label="Cabang Olahraga" value={caborLabel(athlete?.cabor)} />
          <InfoItem label="Kelas Pertandingan" value={athlete?.competition_class?.name} />
          <InfoItem label="Kluster Aktif" value={[athlete?.current_cluster_label, athlete?.current_sub_cluster_label].filter(Boolean).join(' - ')} />
          <InfoItem label="Nomor Atlet Nasional" value={athlete?.national_athlete_number} />
          <div><label className="text-xs text-slate-500 uppercase tracking-wider">Status</label><p className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${athlete?.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{athlete?.is_active ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}{athlete?.is_active ? 'Aktif' : 'Tidak Aktif'}</p></div>
        </div>
      </div>
      <Section title="Identitas" icon={User}><InfoGrid items={[
        ['NIK', athlete?.nik], ['No KK', athlete?.no_kk], ['Tempat Lahir', athlete?.birth_place], ['Tanggal Lahir', formatDate(athlete?.birth_date)], ['Jenis Kelamin', GENDER_LABELS[athlete?.gender] || athlete?.gender], ['Agama', athlete?.religion], ['Golongan Darah', athlete?.blood_type], ['Alamat', athlete?.address], ['Provinsi', athlete?.province], ['Kota/Kabupaten', athlete?.city], ['Kecamatan/Distrik', athlete?.district], ['Kelurahan/Desa', athlete?.village]
      ]} /></Section>
      <Section title="Kontak dan Fisik" icon={HeartPulse}><InfoGrid items={[
        ['Telepon', athlete?.phone], ['Email', athlete?.email], ['Tinggi', athlete?.height ? `${athlete.height} cm` : ''], ['Berat', athlete?.weight ? `${athlete.weight} kg` : ''], ['Pekerjaan', athlete?.occupation], ['Status Pernikahan', athlete?.marital_status], ['Hobi', athlete?.hobby], ['Mulai Karir', athlete?.career_start_year]
      ]} /></Section>
      <Section title="Pendidikan dan Organisasi" icon={GraduationCap}><InfoGrid items={[
        ['Organisasi', athlete?.organization?.name], ['Pendidikan', educationLevelName], ['Riwayat Cedera/Penyakit', athlete?.injury_illness_history]
      ]} /></Section>
      <Section title="Orang Tua/Wali" icon={Users}><InfoGrid items={[
        ['Nama Ayah', athlete?.father_name], ['No. HP Ayah', athlete?.father_phone], ['Nama Ibu', athlete?.mother_name], ['No. HP Ibu', athlete?.mother_phone], ['Alamat Orang Tua/Wali', athlete?.parent_address]
      ]} /></Section>
      <Section title="Prestasi Terbaik" icon={Award}>{athlete?.top_achievements?.length ? <ul className="list-disc pl-5 text-slate-700 space-y-1">{athlete.top_achievements.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="text-slate-500">Belum ada data prestasi.</p>}</Section>
    </div>
  );
}

function Section({ title, icon, children }) {
  const Icon = icon;
  return <div className="border border-slate-100 rounded-2xl p-4"><h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4"><Icon className="w-5 h-5 text-red-600" />{title}</h4>{children}</div>;
}

function InfoGrid({ items }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{items.map(([label, value]) => <InfoItem key={label} label={label} value={value} />)}</div>;
}

function AthleteProfileEditor({ athlete, onCancel, onSuccess, missingFields }) {
  const updateProfile = useUpdatePortalProfile();
  const controller = useAthleteFormController({
    isOpen: true,
    athlete,
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

      <AthletePersonalStep
        athlete={athlete}
        form={form}
        lookups={lookups}
        files={files}
        validation={validation}
      />
      <AthletePhysicalContactStep form={form} lookups={lookups} validation={validation} />
      <AthleteCareerStep
        form={form}
        validation={validation}
        showActiveStatus={false}
      />
      <AthleteParentsStep form={form} validation={validation} />

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

function ClustersTab({ athlete, clusters, loading }) {
  return <div className="space-y-4"><h3 className="text-lg font-bold text-slate-800">Riwayat Kluster</h3><div className="p-4 bg-red-50 rounded-2xl border border-red-100"><p className="text-sm text-red-700">Kluster Aktif</p><p className="text-xl font-bold text-red-900">{[athlete?.current_cluster_label, athlete?.current_sub_cluster_label].filter(Boolean).join(' - ') || '-'}</p></div>{loading ? <Loading /> : clusters.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500 border-b"><th className="py-3">Kluster</th><th>Sub Kluster</th><th>Mulai</th><th>Selesai</th><th>Perubahan</th><th>Alasan</th></tr></thead><tbody>{clusters.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="py-3 font-medium text-slate-800">{item.cluster_label}</td><td>{textOrDash(item.sub_cluster_label)}</td><td>{formatDate(item.start_date)}</td><td>{item.end_date ? formatDate(item.end_date) : <span className="text-green-700 font-medium">Aktif</span>}</td><td>{item.change_label}</td><td>{textOrDash(item.reason)}</td></tr>)}</tbody></table></div> : <Empty icon={Layers} text="Belum ada riwayat kluster" />}</div>;
}

function FundsTab({ funds, fundsData, loading, year, setYear }) {
  return <div className="space-y-4"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-800">Uang Pembinaan</h3><p className="text-sm text-slate-500">Data read-only milik akun atlet ini.</p></div><input type="number" value={year} onChange={(e) => setYear(Number(e.target.value) || currentYear)} className="w-32 px-3 py-2 border border-slate-200 rounded-lg" /></div><div className="p-4 bg-green-50 rounded-2xl border border-green-100"><p className="text-sm text-green-700">Total Tahun {year}</p><p className="text-2xl font-bold text-green-900">{formatCurrency(fundsData?.total_amount || funds.reduce((sum, item) => sum + Number(item.amount || 0), 0))}</p></div>{loading ? <Loading /> : funds.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500 border-b"><th className="py-3">Tanggal</th><th>Bulan</th><th>Nominal</th><th>Kluster</th><th>Keterangan</th></tr></thead><tbody>{funds.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="py-3">{formatDate(item.fund_date)}</td><td>{item.month}/{item.year}</td><td className="font-semibold text-slate-800">{formatCurrency(item.amount)}</td><td>{textOrDash(item.cluster_history?.cluster_label)}</td><td>{textOrDash(item.description)}</td></tr>)}</tbody></table></div> : <Empty icon={Wallet} text="Belum ada data uang pembinaan" />}</div>;
}

function EventsTab({ events, loading }) {
  return <div className="space-y-4"><h3 className="text-lg font-bold text-slate-800">Event Saya</h3>{loading ? <Loading /> : events?.length > 0 ? <div className="space-y-3">{events.map((event) => <MotionDiv key={event.event_key || `${event.source || 'legacy'}:${event.id}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0"><Calendar className="w-6 h-6 text-red-600" /></div><div className="flex-1 min-w-0"><h4 className="font-medium text-slate-800 truncate">{event.name}</h4><div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">{event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}{event.start_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(event.start_date)}</span>}</div></div><span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{event.athlete_status || event.status}</span></MotionDiv>)}</div> : <Empty icon={Calendar} text="Belum ada event yang terdaftar" />}</div>;
}

function SubmissionsTab({ submissions, loading }) {
  return <div className="space-y-4"><h3 className="text-lg font-bold text-slate-800">Riwayat Form Submission</h3>{loading ? <Loading /> : submissions?.length > 0 ? <div className="space-y-3">{submissions.map((sub) => <MotionDiv key={sub.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0"><FileText className="w-6 h-6 text-purple-600" /></div><div className="flex-1 min-w-0"><h4 className="font-medium text-slate-800 truncate">{sub.template_name}</h4><div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">{sub.event_name && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{sub.event_name}</span>}<span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(sub.submitted_at)}</span></div></div><span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Terkirim</span></MotionDiv>)}</div> : <Empty icon={FileText} text="Belum ada form yang diisi" />}</div>;
}

function Loading() {
  return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-red-600" /></div>;
}

function Empty({ icon, text }) {
  const Icon = icon;
  return <div className="text-center py-12 text-slate-400"><Icon className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{text}</p></div>;
}
