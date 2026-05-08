import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Users, Calendar, Award, MapPin, Clock, Phone, Mail,
  Loader2, Edit2, Save, X, Layers, Wallet
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { usePortalProfile, usePortalEvents, usePortalDashboard, usePortalAthletes, useUpdatePortalProfile, usePortalCoachClusterHistories, usePortalCoachDevelopmentFunds } from '../hooks/queries/usePortal';

const currentYear = new Date().getFullYear();
const GENDER_LABELS = { male: 'Laki-laki', female: 'Perempuan' };
const textOrDash = (value) => value || '-';
const formatDate = (value) => value ? new Date(value).toLocaleDateString('id-ID') : '-';
const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));

export function CoachPortal() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [fundYear, setFundYear] = useState(currentYear);
  
  const { data: profile, isLoading: profileLoading } = usePortalProfile();
  const { data: events, isLoading: eventsLoading } = usePortalEvents();
  const { data: dashboard, isLoading: dashboardLoading } = usePortalDashboard();
  const { data: athletes, isLoading: athletesLoading } = usePortalAthletes();
  const { data: clustersData, isLoading: clustersLoading } = usePortalCoachClusterHistories();
  const { data: fundsData, isLoading: fundsLoading } = usePortalCoachDevelopmentFunds({ year: fundYear, perPage: 100 });
  const updateProfile = useUpdatePortalProfile();
  const clusters = clustersData?.data || [];
  const funds = fundsData?.data || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'clusters', label: 'Kluster', icon: Layers },
    { id: 'funds', label: 'Dana Pembinaan', icon: Wallet },
    { id: 'athletes', label: 'Atlet Saya', icon: Users },
    { id: 'events', label: 'Event', icon: Calendar },
  ];

  const handleEditStart = () => {
    setEditData({
      phone: profile?.phone || '',
      email: profile?.email || '',
      address: profile?.details?.address || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (profileLoading || dashboardLoading) {
    return (
      <DashboardLayout title="Portal Pelatih" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Portal Pelatih" 
      subtitle={`Selamat datang, ${profile?.name || 'Pelatih'}!`}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-5 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Atlet</p>
              <p className="text-3xl font-bold">{dashboard?.total_athletes || 0}</p>
            </div>
            <Users className="w-10 h-10 opacity-80" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-5 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Event</p>
              <p className="text-3xl font-bold">{dashboard?.total_events || 0}</p>
            </div>
            <Calendar className="w-10 h-10 opacity-80" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-5 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Event Mendatang</p>
              <p className="text-3xl font-bold">{dashboard?.upcoming_events || 0}</p>
            </div>
            <Clock className="w-10 h-10 opacity-80" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl p-5 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Cabor</p>
              <p className="text-xl font-bold truncate">{dashboard?.cabor_name || '-'}</p>
            </div>
            <Award className="w-10 h-10 opacity-80" />
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="flex border-b border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors
                ${activeTab === tab.id 
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Profil Saya</h3>
                {!isEditing ? (
                  <button
                    onClick={handleEditStart}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profil
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Batal
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updateProfile.isPending}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Simpan
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                    <p className="text-slate-800 font-medium">{profile?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400"
                      />
                    ) : (
                      <p className="text-slate-800 font-medium">{profile?.email || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">Telepon</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400"
                      />
                    ) : (
                      <p className="text-slate-800 font-medium">{profile?.phone || '-'}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">Cabang Olahraga</label>
                    <p className="text-slate-800 font-medium">{profile?.cabor_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">Spesialisasi</label>
                    <p className="text-slate-800 font-medium">{profile?.details?.specialization || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">No. Lisensi</label>
                    <p className="text-slate-800 font-medium">{profile?.details?.license_number || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">Kluster Aktif</label>
                    <p className="text-slate-800 font-medium">{[profile?.details?.current_cluster_label, profile?.details?.current_sub_cluster_label].filter(Boolean).join(' - ') || 'Pelatih Non Binaan'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clusters' && <ClustersTab coach={profile?.details} clusters={clusters} loading={clustersLoading} />}
          {activeTab === 'funds' && <FundsTab funds={funds} fundsData={fundsData} loading={fundsLoading} year={fundYear} setYear={setFundYear} />}

          {/* Athletes Tab */}
          {activeTab === 'athletes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Atlet Saya</h3>
                <span className="text-sm text-slate-500">
                  {athletes?.length || 0} atlet di cabor {dashboard?.cabor_name || '-'}
                </span>
              </div>
              {athletesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                </div>
              ) : athletes?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {athletes.map((athlete) => (
                    <motion.div
                      key={athlete.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {athlete.photo ? (
                          <img src={athlete.photo} alt={athlete.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 truncate">{athlete.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          {athlete.gender && (
                            <span>{GENDER_LABELS[athlete.gender] || athlete.gender}</span>
                          )}
                          {athlete.birth_date && (
                            <span>• {new Date(athlete.birth_date).toLocaleDateString('id-ID')}</span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        athlete.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {athlete.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Belum ada atlet terdaftar di cabor ini</p>
                </div>
              )}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Event Cabor</h3>
              {eventsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                </div>
              ) : events?.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 truncate">{event.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                          {event.start_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(event.start_date).toLocaleDateString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.status === 'active' ? 'bg-green-100 text-green-700' :
                        event.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {event.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Belum ada event untuk cabor ini</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ClustersTab({ coach, clusters, loading }) {
  return <div className="space-y-4"><h3 className="text-lg font-bold text-slate-800">Riwayat Kluster</h3><div className="p-4 bg-red-50 rounded-2xl border border-red-100"><p className="text-sm text-red-700">Kluster Aktif</p><p className="text-xl font-bold text-red-900">{[coach?.current_cluster_label, coach?.current_sub_cluster_label].filter(Boolean).join(' - ') || 'Pelatih Non Binaan'}</p></div>{loading ? <Loading /> : clusters.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500 border-b"><th className="py-3">Kluster</th><th>Sub Kluster</th><th>Mulai</th><th>Selesai</th><th>Perubahan</th><th>Alasan</th></tr></thead><tbody>{clusters.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="py-3 font-medium text-slate-800">{item.cluster_label}</td><td>{textOrDash(item.sub_cluster_label)}</td><td>{formatDate(item.start_date)}</td><td>{item.end_date ? formatDate(item.end_date) : <span className="text-green-700 font-medium">Aktif</span>}</td><td>{item.change_label}</td><td>{textOrDash(item.reason)}</td></tr>)}</tbody></table></div> : <Empty icon={Layers} text="Belum ada riwayat kluster" />}</div>;
}

function FundsTab({ funds, fundsData, loading, year, setYear }) {
  return <div className="space-y-4"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-800">Dana Pembinaan</h3><p className="text-sm text-slate-500">Data read-only milik akun pelatih ini.</p></div><input type="number" value={year} onChange={(e) => setYear(Number(e.target.value) || currentYear)} className="w-32 px-3 py-2 border border-slate-200 rounded-lg" /></div><div className="p-4 bg-green-50 rounded-2xl border border-green-100"><p className="text-sm text-green-700">Total Tahun {year}</p><p className="text-2xl font-bold text-green-900">{formatCurrency(fundsData?.total_amount || funds.reduce((sum, item) => sum + Number(item.amount || 0), 0))}</p></div>{loading ? <Loading /> : funds.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500 border-b"><th className="py-3">Tanggal</th><th>Bulan</th><th>Nominal</th><th>Kluster</th><th>Keterangan</th></tr></thead><tbody>{funds.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="py-3">{formatDate(item.fund_date)}</td><td>{item.month}/{item.year}</td><td className="font-semibold text-slate-800">{formatCurrency(item.amount)}</td><td>{textOrDash(item.cluster_history?.sub_cluster_label || item.cluster_history?.cluster_label)}</td><td>{textOrDash(item.description)}</td></tr>)}</tbody></table></div> : <Empty icon={Wallet} text="Belum ada data dana pembinaan" />}</div>;
}

function Loading() {
  return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-red-600" /></div>;
}

function Empty({ icon: Icon, text }) {
  return <div className="text-center py-12 text-slate-400"><Icon className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{text}</p></div>;
}
