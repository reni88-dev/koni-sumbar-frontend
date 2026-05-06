import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Calendar, FileText, Award, MapPin, Clock,
  Loader2, Edit2, Save, X, CheckCircle, AlertCircle,
  Layers, Wallet, Printer, GraduationCap, Users, HeartPulse
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedImage } from '../components/ProtectedImage';
import {
  usePortalProfile,
  usePortalEvents,
  usePortalSubmissions,
  usePortalDashboard,
  useUpdatePortalProfile,
  usePortalClusterHistories,
  usePortalDevelopmentFunds,
} from '../hooks/queries/usePortal';
import { useCaborsAll } from '../hooks/queries/useCabors';
import { useOrganizationsAll } from '../hooks/queries/useOrganizations';
import { useCompetitionClassesByCabor, useEducationLevelsAll } from '../hooks/queries/useMasterData';

const currentYear = new Date().getFullYear();
const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const GENDER_LABELS = { male: 'Laki-laki', female: 'Perempuan' };
const emptyForm = {
  name: '', nik: '', no_kk: '', national_athlete_number: '', birth_place: '', birth_date: '',
  gender: '', religion: '', address: '', blood_type: '', height: '', weight: '', phone: '', email: '',
  occupation: '', marital_status: '', hobby: '', career_start_year: '', injury_illness_history: '',
  father_name: '', father_phone: '', mother_name: '', mother_phone: '', parent_address: '',
  cabor_id: '', competition_class_id: '', organization_id: '', education_level_id: '', top_achievements: [''],
};

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

function toFormData(athlete) {
  const form = { ...emptyForm };
  Object.keys(form).forEach((key) => {
    if (key === 'top_achievements') return;
    const value = athlete?.[key];
    form[key] = value === null || value === undefined ? '' : String(value);
  });
  form.top_achievements = Array.isArray(athlete?.top_achievements) && athlete.top_achievements.length
    ? athlete.top_achievements
    : [''];
  return form;
}

function compactPayload(data) {
  return {
    ...data,
    cabor_id: Number(data.cabor_id) || 0,
    competition_class_id: Number(data.competition_class_id) || 0,
    organization_id: Number(data.organization_id) || 0,
    education_level_id: Number(data.education_level_id) || 0,
    height: Number(data.height) || 0,
    weight: Number(data.weight) || 0,
    career_start_year: Number(data.career_start_year) || 0,
    top_achievements: data.top_achievements.map((item) => item.trim()).filter(Boolean),
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

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

function inputClass() {
  return 'w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400';
}

function buildPrintHtml({ athlete, clusters, funds }) {
  const rows = [
    ['Nama', athlete?.name], ['NIK', athlete?.nik], ['No KK', athlete?.no_kk], ['Nomor Atlet Nasional', athlete?.national_athlete_number],
    ['Cabang Olahraga', caborLabel(athlete?.cabor)], ['Kelas Pertandingan', athlete?.competition_class?.name], ['Organisasi', athlete?.organization?.name],
    ['Tempat/Tanggal Lahir', `${textOrDash(athlete?.birth_place)} / ${formatDate(athlete?.birth_date)}`], ['Jenis Kelamin', GENDER_LABELS[athlete?.gender] || athlete?.gender],
    ['Agama', athlete?.religion], ['Alamat', athlete?.address], ['Telepon', athlete?.phone], ['Email', athlete?.email],
    ['Tinggi/Berat', `${athlete?.height || '-'} cm / ${athlete?.weight || '-'} kg`], ['Golongan Darah', athlete?.blood_type],
    ['Pekerjaan', athlete?.occupation], ['Status Pernikahan', athlete?.marital_status], ['Hobi', athlete?.hobby],
    ['Mulai Karir', athlete?.career_start_year], ['Riwayat Cedera/Penyakit', athlete?.injury_illness_history],
    ['Ayah', `${textOrDash(athlete?.father_name)} (${textOrDash(athlete?.father_phone)})`],
    ['Ibu', `${textOrDash(athlete?.mother_name)} (${textOrDash(athlete?.mother_phone)})`], ['Alamat Orang Tua/Wali', athlete?.parent_address],
    ['Kluster Aktif', [athlete?.current_cluster_label, athlete?.current_sub_cluster_label].filter(Boolean).join(' - ')],
  ];
  return `<!doctype html><html><head><title>Profil Atlet</title><style>
    body{font-family:Arial,sans-serif;color:#1e293b;margin:32px} h1{margin:0 0 4px} h2{margin-top:28px;border-bottom:1px solid #e2e8f0;padding-bottom:6px} table{width:100%;border-collapse:collapse;margin-top:12px} td,th{border:1px solid #e2e8f0;padding:8px;text-align:left;vertical-align:top} th{background:#f8fafc} .muted{color:#64748b} ul{margin:8px 0 0 18px}
  </style></head><body><h1>Profil Atlet</h1><p class="muted">Dicetak dari Portal Atlet</p>
  <h2>Data Profil</h2><table>${rows.map(([k, v]) => `<tr><th style="width:30%">${k}</th><td>${textOrDash(v)}</td></tr>`).join('')}</table>
  <h2>Prestasi Terbaik</h2><ul>${(athlete?.top_achievements || []).map((a) => `<li>${a}</li>`).join('') || '<li>-</li>'}</ul>
  <h2>Riwayat Kluster</h2><table><thead><tr><th>Kluster</th><th>Sub Kluster</th><th>Mulai</th><th>Selesai</th><th>Perubahan</th></tr></thead><tbody>${(clusters || []).map((c) => `<tr><td>${textOrDash(c.cluster_label)}</td><td>${textOrDash(c.sub_cluster_label)}</td><td>${formatDate(c.start_date)}</td><td>${c.end_date ? formatDate(c.end_date) : 'Aktif'}</td><td>${textOrDash(c.change_label)}</td></tr>`).join('') || '<tr><td colspan="5">Belum ada data</td></tr>'}</tbody></table>
  <h2>Uang Pembinaan</h2><table><thead><tr><th>Tanggal</th><th>Bulan/Tahun</th><th>Nominal</th><th>Keterangan</th></tr></thead><tbody>${(funds || []).map((f) => `<tr><td>${formatDate(f.fund_date)}</td><td>${f.month}/${f.year}</td><td>${formatCurrency(f.amount)}</td><td>${textOrDash(f.description)}</td></tr>`).join('') || '<tr><td colspan="4">Belum ada data</td></tr>'}</tbody></table>
  <script>window.onload=function(){window.print()}</script></body></html>`;
}

export function AthletePortal() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(emptyForm);
  const [fundYear, setFundYear] = useState(currentYear);

  const { data: profile, isLoading: profileLoading } = usePortalProfile();
  const { data: events, isLoading: eventsLoading } = usePortalEvents();
  const { data: submissions, isLoading: submissionsLoading } = usePortalSubmissions();
  const { data: dashboard, isLoading: dashboardLoading } = usePortalDashboard();
  const { data: clustersData, isLoading: clustersLoading } = usePortalClusterHistories();
  const { data: fundsData, isLoading: fundsLoading } = usePortalDevelopmentFunds({ year: fundYear, perPage: 100 });
  const { data: cabors = [] } = useCaborsAll();
  const { data: organizations = [] } = useOrganizationsAll();
  const { data: educationLevels = [] } = useEducationLevelsAll();
  const { data: competitionClasses = [] } = useCompetitionClassesByCabor(editData.cabor_id);
  const updateProfile = useUpdatePortalProfile();

  const athlete = useMemo(() => getAthlete(profile), [profile]);
  const clusters = clustersData?.data || [];
  const funds = fundsData?.data || [];

  const tabs = [
    { id: 'overview', label: 'Profil', icon: User },
    { id: 'clusters', label: 'Kluster', icon: Layers },
    { id: 'funds', label: 'Uang Pembinaan', icon: Wallet },
    { id: 'events', label: 'Event Saya', icon: Calendar },
    { id: 'submissions', label: 'Form Submission', icon: FileText },
  ];

  const handleEditStart = () => {
    setEditData(toFormData(athlete));
    setIsEditing(true);
  };

  const handleChange = (key, value) => {
    setEditData((prev) => ({ ...prev, [key]: value, ...(key === 'cabor_id' ? { competition_class_id: '' } : {}) }));
  };

  const handleAchievementChange = (index, value) => {
    setEditData((prev) => ({ ...prev, top_achievements: prev.top_achievements.map((item, i) => i === index ? value : item) }));
  };

  const addAchievement = () => setEditData((prev) => ({ ...prev, top_achievements: [...prev.top_achievements, ''] }));
  const removeAchievement = (index) => setEditData((prev) => ({ ...prev, top_achievements: prev.top_achievements.filter((_, i) => i !== index).length ? prev.top_achievements.filter((_, i) => i !== index) : [''] }));

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(compactPayload(editData));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert(error?.response?.data?.error || error?.response?.data?.message || 'Gagal menyimpan profil');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup diblokir. Izinkan popup untuk mencetak profil.');
      return;
    }
    printWindow.document.write(buildPrintHtml({ athlete, clusters, funds }));
    printWindow.document.close();
  };

  if (profileLoading || dashboardLoading) {
    return (
      <DashboardLayout title="Portal Atlet" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
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
                  <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    <Printer className="w-4 h-4" /> Cetak Profil
                  </button>
                  {!isEditing ? (
                    <button onClick={handleEditStart} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" /> Edit Profil
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-4 h-4" /> Batal</button>
                      <button onClick={handleSave} disabled={updateProfile.isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
                        {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
                      </button>
                    </>
                  )}
                </div>
              </div>

              {!isEditing ? (
                <ProfileView athlete={athlete} educationLevels={educationLevels} />
              ) : (
                <ProfileEdit editData={editData} handleChange={handleChange} cabors={cabors} organizations={organizations} competitionClasses={competitionClasses} educationLevels={educationLevels} handleAchievementChange={handleAchievementChange} addAchievement={addAchievement} removeAchievement={removeAchievement} />
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

function StatCard({ color, label, value, icon: Icon, delay = 0, small = false }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={`bg-gradient-to-br ${color} text-white rounded-2xl p-5 shadow-lg`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0"><p className="text-white/80 text-sm">{label}</p><p className={`${small ? 'text-xl truncate' : 'text-3xl'} font-bold`}>{value}</p></div>
        <Icon className="w-10 h-10 opacity-80 flex-shrink-0" />
      </div>
    </motion.div>
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
        ['NIK', athlete?.nik], ['No KK', athlete?.no_kk], ['Tempat Lahir', athlete?.birth_place], ['Tanggal Lahir', formatDate(athlete?.birth_date)], ['Jenis Kelamin', GENDER_LABELS[athlete?.gender] || athlete?.gender], ['Agama', athlete?.religion], ['Golongan Darah', athlete?.blood_type], ['Alamat', athlete?.address]
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

function Section({ title, icon: Icon, children }) {
  return <div className="border border-slate-100 rounded-2xl p-4"><h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4"><Icon className="w-5 h-5 text-red-600" />{title}</h4>{children}</div>;
}

function InfoGrid({ items }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{items.map(([label, value]) => <InfoItem key={label} label={label} value={value} />)}</div>;
}

function ProfileEdit({ editData, handleChange, cabors, organizations, competitionClasses, educationLevels, handleAchievementChange, addAchievement, removeAchievement }) {
  return (
    <div className="space-y-6">
      <EditSection title="Identitas">
        <TextInput label="Nama Lengkap" value={editData.name} onChange={(v) => handleChange('name', v)} />
        <TextInput label="NIK" value={editData.nik} onChange={(v) => handleChange('nik', v)} />
        <TextInput label="No KK" value={editData.no_kk} onChange={(v) => handleChange('no_kk', v)} />
        <TextInput label="Nomor Atlet Nasional" value={editData.national_athlete_number} onChange={(v) => handleChange('national_athlete_number', v)} />
        <TextInput label="Tempat Lahir" value={editData.birth_place} onChange={(v) => handleChange('birth_place', v)} />
        <TextInput label="Tanggal Lahir" type="date" value={editData.birth_date} onChange={(v) => handleChange('birth_date', v)} />
        <SelectInput label="Jenis Kelamin" value={editData.gender} onChange={(v) => handleChange('gender', v)} options={[['male', 'Laki-laki'], ['female', 'Perempuan']]} />
        <SelectInput label="Agama" value={editData.religion} onChange={(v) => handleChange('religion', v)} options={RELIGIONS.map((v) => [v, v])} />
        <SelectInput label="Golongan Darah" value={editData.blood_type} onChange={(v) => handleChange('blood_type', v)} options={['A', 'B', 'AB', 'O'].map((v) => [v, v])} />
      </EditSection>
      <EditSection title="Cabor, Organisasi, Pendidikan">
        <SelectInput label="Cabang Olahraga" value={editData.cabor_id} onChange={(v) => handleChange('cabor_id', v)} options={cabors.map((c) => [c.id, c.display_name || c.name])} />
        <SelectInput label="Kelas Pertandingan" value={editData.competition_class_id} onChange={(v) => handleChange('competition_class_id', v)} options={competitionClasses.map((c) => [c.id, c.name])} />
        <SelectInput label="Organisasi" value={editData.organization_id} onChange={(v) => handleChange('organization_id', v)} options={organizations.map((o) => [o.id, o.name])} />
        <SelectInput label="Pendidikan" value={editData.education_level_id} onChange={(v) => handleChange('education_level_id', v)} options={educationLevels.map((e) => [e.id, e.name])} />
      </EditSection>
      <EditSection title="Kontak dan Data Pribadi">
        <TextInput label="Telepon" value={editData.phone} onChange={(v) => handleChange('phone', v)} />
        <TextInput label="Email" type="email" value={editData.email} onChange={(v) => handleChange('email', v)} />
        <TextInput label="Tinggi (cm)" type="number" value={editData.height} onChange={(v) => handleChange('height', v)} />
        <TextInput label="Berat (kg)" type="number" value={editData.weight} onChange={(v) => handleChange('weight', v)} />
        <TextInput label="Pekerjaan" value={editData.occupation} onChange={(v) => handleChange('occupation', v)} />
        <TextInput label="Status Pernikahan" value={editData.marital_status} onChange={(v) => handleChange('marital_status', v)} />
        <TextInput label="Hobi" value={editData.hobby} onChange={(v) => handleChange('hobby', v)} />
        <TextInput label="Mulai Karir" type="number" value={editData.career_start_year} onChange={(v) => handleChange('career_start_year', v)} />
        <TextareaInput label="Alamat" value={editData.address} onChange={(v) => handleChange('address', v)} />
        <TextareaInput label="Riwayat Cedera/Penyakit" value={editData.injury_illness_history} onChange={(v) => handleChange('injury_illness_history', v)} />
      </EditSection>
      <EditSection title="Orang Tua/Wali">
        <TextInput label="Nama Ayah" value={editData.father_name} onChange={(v) => handleChange('father_name', v)} />
        <TextInput label="No. HP Ayah" value={editData.father_phone} onChange={(v) => handleChange('father_phone', v)} />
        <TextInput label="Nama Ibu" value={editData.mother_name} onChange={(v) => handleChange('mother_name', v)} />
        <TextInput label="No. HP Ibu" value={editData.mother_phone} onChange={(v) => handleChange('mother_phone', v)} />
        <TextareaInput label="Alamat Orang Tua/Wali" value={editData.parent_address} onChange={(v) => handleChange('parent_address', v)} />
      </EditSection>
      <div className="border border-slate-100 rounded-2xl p-4"><h4 className="font-bold text-slate-800 mb-4">Prestasi Terbaik</h4><div className="space-y-2">{editData.top_achievements.map((item, index) => <div key={index} className="flex gap-2"><input value={item} onChange={(e) => handleAchievementChange(index, e.target.value)} className={inputClass()} placeholder="Contoh: Juara 1 Porprov" /><button type="button" onClick={() => removeAchievement(index)} className="mt-1 px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button></div>)}<button type="button" onClick={addAchievement} className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg">Tambah Prestasi</button></div></div>
    </div>
  );
}

function EditSection({ title, children }) {
  return <div className="border border-slate-100 rounded-2xl p-4"><h4 className="font-bold text-slate-800 mb-4">{title}</h4><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div></div>;
}

function TextInput({ label, value, onChange, type = 'text' }) {
  return <Field label={label}><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass()} /></Field>;
}

function TextareaInput({ label, value, onChange }) {
  return <Field label={label}><textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={inputClass()} /></Field>;
}

function SelectInput({ label, value, onChange, options }) {
  return <Field label={label}><select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass()}><option value="">Pilih</option>{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>;
}

function ClustersTab({ athlete, clusters, loading }) {
  return <div className="space-y-4"><h3 className="text-lg font-bold text-slate-800">Riwayat Kluster</h3><div className="p-4 bg-red-50 rounded-2xl border border-red-100"><p className="text-sm text-red-700">Kluster Aktif</p><p className="text-xl font-bold text-red-900">{[athlete?.current_cluster_label, athlete?.current_sub_cluster_label].filter(Boolean).join(' - ') || '-'}</p></div>{loading ? <Loading /> : clusters.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500 border-b"><th className="py-3">Kluster</th><th>Sub Kluster</th><th>Mulai</th><th>Selesai</th><th>Perubahan</th><th>Alasan</th></tr></thead><tbody>{clusters.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="py-3 font-medium text-slate-800">{item.cluster_label}</td><td>{textOrDash(item.sub_cluster_label)}</td><td>{formatDate(item.start_date)}</td><td>{item.end_date ? formatDate(item.end_date) : <span className="text-green-700 font-medium">Aktif</span>}</td><td>{item.change_label}</td><td>{textOrDash(item.reason)}</td></tr>)}</tbody></table></div> : <Empty icon={Layers} text="Belum ada riwayat kluster" />}</div>;
}

function FundsTab({ funds, fundsData, loading, year, setYear }) {
  return <div className="space-y-4"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-800">Uang Pembinaan</h3><p className="text-sm text-slate-500">Data read-only milik akun atlet ini.</p></div><input type="number" value={year} onChange={(e) => setYear(Number(e.target.value) || currentYear)} className="w-32 px-3 py-2 border border-slate-200 rounded-lg" /></div><div className="p-4 bg-green-50 rounded-2xl border border-green-100"><p className="text-sm text-green-700">Total Tahun {year}</p><p className="text-2xl font-bold text-green-900">{formatCurrency(fundsData?.total_amount || funds.reduce((sum, item) => sum + Number(item.amount || 0), 0))}</p></div>{loading ? <Loading /> : funds.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500 border-b"><th className="py-3">Tanggal</th><th>Bulan</th><th>Nominal</th><th>Kluster</th><th>Keterangan</th></tr></thead><tbody>{funds.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="py-3">{formatDate(item.fund_date)}</td><td>{item.month}/{item.year}</td><td className="font-semibold text-slate-800">{formatCurrency(item.amount)}</td><td>{textOrDash(item.cluster_history?.cluster_label)}</td><td>{textOrDash(item.description)}</td></tr>)}</tbody></table></div> : <Empty icon={Wallet} text="Belum ada data uang pembinaan" />}</div>;
}

function EventsTab({ events, loading }) {
  return <div className="space-y-4"><h3 className="text-lg font-bold text-slate-800">Event Saya</h3>{loading ? <Loading /> : events?.length > 0 ? <div className="space-y-3">{events.map((event) => <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0"><Calendar className="w-6 h-6 text-red-600" /></div><div className="flex-1 min-w-0"><h4 className="font-medium text-slate-800 truncate">{event.name}</h4><div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">{event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}{event.start_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(event.start_date)}</span>}</div></div><span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{event.athlete_status || event.status}</span></motion.div>)}</div> : <Empty icon={Calendar} text="Belum ada event yang terdaftar" />}</div>;
}

function SubmissionsTab({ submissions, loading }) {
  return <div className="space-y-4"><h3 className="text-lg font-bold text-slate-800">Riwayat Form Submission</h3>{loading ? <Loading /> : submissions?.length > 0 ? <div className="space-y-3">{submissions.map((sub) => <motion.div key={sub.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0"><FileText className="w-6 h-6 text-purple-600" /></div><div className="flex-1 min-w-0"><h4 className="font-medium text-slate-800 truncate">{sub.template_name}</h4><div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">{sub.event_name && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{sub.event_name}</span>}<span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(sub.submitted_at)}</span></div></div><span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Terkirim</span></motion.div>)}</div> : <Empty icon={FileText} text="Belum ada form yang diisi" />}</div>;
}

function Loading() {
  return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-red-600" /></div>;
}

function Empty({ icon: Icon, text }) {
  return <div className="text-center py-12 text-slate-400"><Icon className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{text}</p></div>;
}
