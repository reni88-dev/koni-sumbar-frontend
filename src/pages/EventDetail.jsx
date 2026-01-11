import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Plus,
  X,
  Loader2,
  Search,
  Check,
  XCircle,
  Clock
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { DashboardLayout } from '../components/DashboardLayout';

export function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [cabors, setCabors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [athletesLoading, setAthletesLoading] = useState(false);
  
  // Filter
  const [filterCabor, setFilterCabor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Register Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [availableAthletes, setAvailableAthletes] = useState([]);
  const [registerForm, setRegisterForm] = useState({ athlete_id: '', cabor_id: '', notes: '' });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const statusColors = {
    registered: 'bg-yellow-100 text-yellow-700',
    verified: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700'
  };
  const statusLabels = { registered: 'Terdaftar', verified: 'Terverifikasi', rejected: 'Ditolak' };

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/api/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Failed to fetch event:', error);
    }
  };

  const fetchAthletes = async () => {
    setAthletesLoading(true);
    try {
      const response = await api.get(`/api/events/${id}/athletes`, {
        params: { cabor_id: filterCabor || undefined, status: filterStatus || undefined }
      });
      setAthletes(response.data);
    } catch (error) {
      console.error('Failed to fetch athletes:', error);
    } finally {
      setAthletesLoading(false);
    }
  };

  const fetchCabors = async () => {
    try {
      const response = await api.get('/api/master/cabors/all');
      setCabors(response.data);
    } catch (error) {
      console.error('Failed to fetch cabors:', error);
    }
  };

  const fetchAvailableAthletes = async () => {
    try {
      const response = await api.get('/api/athletes/all');
      setAvailableAthletes(response.data);
    } catch (error) {
      console.error('Failed to fetch athletes:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchEvent();
      await fetchAthletes();
      await fetchCabors();
      setLoading(false);
    };
    init();
  }, [id]);

  useEffect(() => {
    if (!loading) fetchAthletes();
  }, [filterCabor, filterStatus]);

  const openRegisterModal = async () => {
    await fetchAvailableAthletes();
    setRegisterForm({ athlete_id: '', cabor_id: '', notes: '' });
    setRegisterError('');
    setIsRegisterModalOpen(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError('');

    try {
      await api.post(`/api/events/${id}/athletes`, registerForm);
      setIsRegisterModalOpen(false);
      fetchAthletes();
      fetchEvent();
    } catch (error) {
      setRegisterError(error.response?.data?.message || 'Gagal mendaftarkan atlet');
    } finally {
      setRegisterLoading(false);
    }
  };

  const updateStatus = async (athleteId, status) => {
    try {
      await api.put(`/api/events/${id}/athletes/${athleteId}`, { status });
      fetchAthletes();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const removeAthlete = async (athleteId) => {
    if (!confirm('Hapus atlet dari event ini?')) return;
    try {
      await api.delete(`/api/events/${id}/athletes/${athleteId}`);
      fetchAthletes();
      fetchEvent();
    } catch (error) {
      console.error('Failed to remove athlete:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout title="Event Tidak Ditemukan">
        <div className="text-center py-12">
          <p className="text-slate-500">Event tidak ditemukan</p>
          <Link to="/event" className="text-red-600 hover:underline mt-2 inline-block">Kembali</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={event.name} subtitle={`${event.year} • ${event.location || '-'}`}>
      {/* Back Button */}
      <Link to="/event" className="inline-flex items-center gap-2 text-slate-600 hover:text-red-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Daftar Event</span>
      </Link>

      {/* Event Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Pelaksanaan</p>
            <p className="font-semibold text-slate-800">{formatDate(event.start_date)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <MapPin className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Lokasi</p>
            <p className="font-semibold text-slate-800">{event.location || '-'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Atlet</p>
            <p className="font-semibold text-slate-800">{event.athletes_count || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-xl">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Pendaftaran</p>
            <p className={`font-semibold ${event.registration_status === 'Dibuka' ? 'text-green-600' : event.registration_status === 'Belum Dibuka' ? 'text-yellow-600' : 'text-red-600'}`}>
              {event.registration_status || 'Dibuka'}
            </p>
          </div>
        </div>
      </div>

      {/* Athletes Section */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">Daftar Atlet</h2>
          <div className="flex flex-wrap gap-3">
            <select
              value={filterCabor}
              onChange={(e) => setFilterCabor(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
            >
              <option value="">Semua Cabor</option>
              {cabors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
            >
              <option value="">Semua Status</option>
              <option value="registered">Terdaftar</option>
              <option value="verified">Terverifikasi</option>
              <option value="rejected">Ditolak</option>
            </select>
            <button
              onClick={openRegisterModal}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Atlet</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Atlet</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Cabor</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {athletesLoading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" /></td></tr>
              ) : athletes.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Belum ada atlet terdaftar</td></tr>
              ) : (
                athletes.map((ea) => (
                  <tr key={ea.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-medium">
                          {ea.athlete?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{ea.athlete?.name}</p>
                          <p className="text-xs text-slate-500">{ea.athlete?.nik || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                        {ea.cabor?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[ea.status]}`}>
                        {statusLabels[ea.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {ea.status !== 'verified' && (
                          <button
                            onClick={() => updateStatus(ea.athlete_id, 'verified')}
                            className="p-1.5 hover:bg-green-50 rounded-lg text-slate-500 hover:text-green-600 transition-colors"
                            title="Verifikasi"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {ea.status !== 'rejected' && (
                          <button
                            onClick={() => updateStatus(ea.athlete_id, 'rejected')}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                            title="Tolak"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => removeAthlete(ea.athlete_id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                          title="Hapus"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Modal */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsRegisterModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">Daftarkan Atlet ke Event</h2>
                  <button onClick={() => setIsRegisterModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <form onSubmit={handleRegister} className="p-6 space-y-4">
                  {registerError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                      {registerError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Atlet</label>
                    <select
                      value={registerForm.athlete_id}
                      onChange={e => setRegisterForm({...registerForm, athlete_id: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      required
                    >
                      <option value="">-- Pilih Atlet --</option>
                      {availableAthletes.map(a => (
                        <option key={a.id} value={a.id}>{a.name} {a.nik ? `(${a.nik})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cabor yang Diikuti</label>
                    <select
                      value={registerForm.cabor_id}
                      onChange={e => setRegisterForm({...registerForm, cabor_id: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      required
                    >
                      <option value="">-- Pilih Cabor --</option>
                      {cabors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Catatan (opsional)</label>
                    <textarea
                      value={registerForm.notes}
                      onChange={e => setRegisterForm({...registerForm, notes: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
                      rows={2}
                      placeholder="Catatan khusus..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsRegisterModalOpen(false)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={registerLoading}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {registerLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Daftarkan
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
