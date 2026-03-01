import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Parse Go time.Time serialized TIME field (e.g. "0000-01-01T07:30:00Z" or "07:30")
function formatTime(t) {
  if (!t) return '';
  if (t.includes('T')) {
    const match = t.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : t;
  }
  return t.substring(0, 5);
}
import {
  ArrowLeft, MapPin, Clock, Calendar, Users, Camera,
  CheckCircle2, Loader2, AlertCircle, Navigation
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  useTrainingSession, useCheckinTrainingSession, useCompleteTrainingSession,
  useSubmitAttendances, useUploadTrainingPhotos
} from '../hooks/queries/useTraining';
import { AttendanceTab, PhotosTab } from '../components/training';
import { PrintAttendanceReport } from '../components/training/PrintAttendanceReport';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function TrainingAttendancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: session, isLoading, refetch } = useTrainingSession(id);
  const checkin = useCheckinTrainingSession();
  const complete = useCompleteTrainingSession();
  const submitAttendances = useSubmitAttendances();
  const uploadPhotos = useUploadTrainingPhotos();

  const [attendanceData, setAttendanceData] = useState([]);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('attendance');

  // Alert modal state (replaces native alert)
  const [alertModal, setAlertModal] = useState({ open: false, type: 'error', title: '', message: '' });
  const showAlert = (type, title, message) => setAlertModal({ open: true, type, title, message });
  const closeAlert = () => setAlertModal(m => ({ ...m, open: false }));

  // Confirm dialog for complete session
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (session?.attendances) {
      setAttendanceData(session.attendances.map(a => ({
        athlete_id: a.athlete_id,
        athlete_name: a.athlete?.name || `Atlet #${a.athlete_id}`,
        status: a.status,
        notes: a.notes || '',
      })));
    }
  }, [session]);

  const handleCheckin = async () => {
    setCheckinLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await checkin.mutateAsync({ id: Number(id), latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          refetch();
        } catch (err) {
          showAlert('error', 'Gagal Check-in', err.response?.data?.error || 'Gagal check-in');
        }
        setCheckinLoading(false);
      },
      () => { showAlert('error', 'GPS Error', 'Gagal mendapatkan lokasi GPS. Pastikan GPS aktif dan izinkan akses lokasi.'); setCheckinLoading(false); },
      { enableHighAccuracy: true }
    );
  };

  const handleComplete = async () => {
    setConfirmComplete(false);
    setCompleting(true);
    try {
      await complete.mutateAsync(Number(id));
      refetch();
    } catch (err) {
      showAlert('error', 'Gagal', err.response?.data?.error || 'Gagal menyelesaikan sesi');
    }
    setCompleting(false);
  };

  const updateAttendance = (athleteId, field, value) => {
    setAttendanceData(prev => prev.map(a =>
      a.athlete_id === athleteId ? { ...a, [field]: value } : a
    ));
  };

  const handleSaveAttendance = async () => {
    try {
      await submitAttendances.mutateAsync({
        sessionId: Number(id),
        attendances: attendanceData.map(a => ({ athlete_id: a.athlete_id, status: a.status, notes: a.notes })),
      });
      refetch();
      showAlert('success', 'Berhasil', 'Absensi berhasil disimpan!');
    } catch (err) {
      showAlert('error', 'Gagal', err.response?.data?.error || 'Gagal menyimpan absensi');
    }
  };

  const handleMarkAllPresent = () => {
    setAttendanceData(prev => prev.map(a => ({ ...a, status: 'present' })));
  };

  const handleUploadPhotos = async (formData) => {
    await uploadPhotos.mutateAsync({ sessionId: Number(id), formData });
    refetch();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-red-600 animate-spin" /></div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-slate-400">Sesi tidak ditemukan</div>
      </DashboardLayout>
    );
  }

  const isScheduled = session.status === 'scheduled';
  const isOngoing = session.status === 'ongoing';
  const isCompleted = session.status === 'completed';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/training')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">{session.title}</h1>
            <div className="flex flex-wrap gap-4 mt-1 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />
                {new Date(session.training_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {session.start_time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatTime(session.start_time)}{session.end_time ? ` - ${formatTime(session.end_time)}` : ''}</span>}
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{session.location_name}</span>
              {session.coach && <span className="flex items-center gap-1"><Users className="w-4 h-4" />{session.coach.name}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {isScheduled && (
              <button onClick={handleCheckin} disabled={checkinLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
                {checkinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                Check-in
              </button>
            )}
            {isOngoing && (
              <button onClick={() => setConfirmComplete(true)} disabled={completing}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Selesaikan
              </button>
            )}
            {isCompleted && attendanceData.length > 0 && (
              <PrintAttendanceReport session={session} attendanceData={attendanceData} />
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          isScheduled ? 'bg-blue-50 text-blue-700' : isOngoing ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
        }`}>
          {isScheduled && <><AlertCircle className="w-5 h-5" /><span className="font-medium">Terjadwal — Pelatih harus check-in di lokasi (radius 700m) untuk memulai</span></>}
          {isOngoing && <><Clock className="w-5 h-5" /><span className="font-medium">Sedang berlangsung — Silakan absen atlet & upload foto</span></>}
          {isCompleted && <><CheckCircle2 className="w-5 h-5" /><span className="font-medium">Sesi latihan telah selesai</span></>}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { key: 'attendance', label: 'Absensi', icon: Users },
            { key: 'photos', label: 'Foto Latihan', icon: Camera },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'attendance' && (
          <AttendanceTab
            attendanceData={attendanceData}
            isOngoing={isOngoing}
            isCompleted={isCompleted}
            onUpdateAttendance={updateAttendance}
            onMarkAllPresent={handleMarkAllPresent}
            onSaveAttendance={handleSaveAttendance}
            isSaving={submitAttendances.isPending}
          />
        )}

        {activeTab === 'photos' && (
          <PhotosTab
            session={session}
            isOngoing={isOngoing}
            isScheduled={isScheduled}
            onUploadPhotos={handleUploadPhotos}
          />
        )}
      </div>

      {/* Confirm Complete Dialog */}
      <ConfirmDialog
        isOpen={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        onConfirm={handleComplete}
        title="Selesaikan Sesi Latihan?"
        message="Apakah Anda yakin ingin menyelesaikan sesi latihan ini? Pastikan absensi dan foto sudah lengkap."
        confirmText="Ya, Selesaikan"
        isPending={completing}
      />

      {/* Alert Modal (replaces native alert) */}
      <AnimatePresence>
        {alertModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeAlert}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                alertModal.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {alertModal.type === 'success'
                  ? <CheckCircle2 className="w-8 h-8 text-green-600" />
                  : <AlertCircle className="w-8 h-8 text-red-600" />
                }
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{alertModal.title}</h3>
              <p className="text-slate-500 text-sm mb-6">{alertModal.message}</p>
              <button
                onClick={closeAlert}
                className={`w-full px-4 py-2.5 rounded-xl font-semibold transition-colors ${
                  alertModal.type === 'success'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                OK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
