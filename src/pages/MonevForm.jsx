import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Loader2, AlertCircle, MapPin, ClipboardCheck, FileText, Clock } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { SearchableSelect } from '../components/SearchableSelect';
import { useMonevDetail, useMonevCreate, useMonevUpdate } from '../hooks/useMonev';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';

const QUESTIONS = [
  { key: 'q1_attendance', label: 'Apakah atlet dan pelatih hadir pada sesi latihan?', group: 'Kehadiran & Jadwal' },
  { key: 'q2_schedule', label: 'Apakah latihan dimulai sesuai dengan jadwal yang telah ditetapkan?', group: 'Kehadiran & Jadwal' },
  { key: 'q3_facilities', label: 'Apakah sarana dan prasarana latihan (alat dan lapangan) tersedia dan siap digunakan?', group: 'Sarana & Prasarana' },
  { key: 'q8_venue_readiness', label: 'Apakah tempat/lapangan latihan dikelola dan dipersiapkan dengan baik?', group: 'Sarana & Prasarana' },
  { key: 'q4_material', label: 'Apakah materi latihan sesuai dengan program yang telah direncanakan?', group: 'Program Latihan' },
  { key: 'q5_intensity', label: 'Apakah dosis atau intensitas latihan sesuai dengan tujuan latihan?', group: 'Program Latihan' },
  { key: 'q6_execution', label: 'Apakah atlet melaksanakan gerakan/exercise sesuai instruksi pelatih?', group: 'Program Latihan' },
  { key: 'q7_target', label: 'Apakah target latihan pada sesi ini tercapai?', group: 'Program Latihan' },
  { key: 'q9_communication', label: 'Apakah pelatih berkomunikasi dengan baik kepada atlet selama latihan?', group: 'Komunikasi & Keamanan' },
  { key: 'q10_security', label: 'Apakah pengawasan keamanan dilakukan selama latihan berlangsung?', group: 'Komunikasi & Keamanan' },
  { key: 'q11_nutrition', label: 'Apakah menu makanan bagi atlet tersedia dengan cukup?', group: 'Nutrisi & Suplemen' },
  { key: 'q14_supplements', label: 'Apakah suplemen bagi atlet tersedia?', group: 'Nutrisi & Suplemen' },
  { key: 'q12_athlete_issues', label: 'Apakah terdapat kendala yang dialami atlet selama latihan?', group: 'Kendala' },
  { key: 'q13_coach_issues', label: 'Apakah terdapat kendala yang dialami pelatih selama melatih?', group: 'Kendala' },
  { key: 'q15_discipline', label: 'Apakah atlet disiplin dalam menjaga berat badan idealnya?', group: 'Disiplin' },
];

const GROUPS = [...new Set(QUESTIONS.map(q => q.group))];
const GROUP_COLORS = { 'Kehadiran & Jadwal': '#3b82f6', 'Sarana & Prasarana': '#10b981', 'Program Latihan': '#8b5cf6', 'Komunikasi & Keamanan': '#f59e0b', 'Nutrisi & Suplemen': '#f97316', 'Kendala': '#ef4444', 'Disiplin': '#22c55e' };

export default function MonevForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const isAdminMonev = user?.role?.name === 'admin_monev';

  const { data: existingData, loading: loadingDetail } = useMonevDetail(isEdit ? id : null);
  const { create, loading: creating, error: createError } = useMonevCreate();
  const { update, loading: updating, error: updateError } = useMonevUpdate();

  const [step, setStep] = useState(0);
  const [cabors, setCabors] = useState([]);
  const [venues, setVenues] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [geoError, setGeoError] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [form, setForm] = useState({
    cabor_id: '', venue_id: '', coach_id: '',
    start_time: '', end_time: '',
    monitoring_date: new Date().toISOString().split('T')[0],
    notes: '', monitor_latitude: null, monitor_longitude: null,
  });
  const [answers, setAnswers] = useState(Object.fromEntries(QUESTIONS.map(q => [q.key, false])));
  const [qNotes, setQNotes] = useState(Object.fromEntries(QUESTIONS.map(q => [q.key, ''])));

  useEffect(() => {
    api.get('/api/cabors/all').then(r => setCabors(r.data || [])).catch(() => {});
    api.get('/api/venues/all').then(r => setVenues(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.cabor_id) { setCoaches([]); return; }
    api.get(`/api/coaches?cabor_id=${form.cabor_id}&per_page=100`).then(r => setCoaches(r.data?.data || [])).catch(() => {});
  }, [form.cabor_id]);

  useEffect(() => {
    if (!existingData || !isEdit) return;
    setForm({ cabor_id: String(existingData.cabor_id||''), venue_id: String(existingData.venue_id||''),
      coach_id: existingData.coach_id ? String(existingData.coach_id) : '',
      start_time: existingData.start_time||'', end_time: existingData.end_time||'',
      monitoring_date: existingData.monitoring_date?.split('T')[0]||'', notes: existingData.notes||'',
      monitor_latitude: existingData.monitor_latitude||null, monitor_longitude: existingData.monitor_longitude||null });
    setAnswers(Object.fromEntries(QUESTIONS.map(q => [q.key, existingData[q.key]||false])));
    const n = {};
    QUESTIONS.forEach(q => { const nk = q.key.replace(/^(q\d+)_.*/, '$1_note'); n[q.key] = existingData[nk]||''; });
    setQNotes(n);
  }, [existingData, isEdit]);

  useEffect(() => { if (isAdminMonev && !form.monitor_latitude) requestGeo(); }, []);

  const requestGeo = () => {
    if (!navigator.geolocation) { setGeoError('Browser tidak mendukung geolokasi'); return; }
    setGeoLoading(true); setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      pos => { setForm(f => ({ ...f, monitor_latitude: pos.coords.latitude, monitor_longitude: pos.coords.longitude })); setGeoLoading(false); },
      () => { setGeoError('Izin lokasi ditolak. Lokasi wajib untuk mengisi form monitoring.'); setGeoLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const score = QUESTIONS.filter(q => {
    if (q.key === 'q12_athlete_issues' || q.key === 'q13_coach_issues') return !answers[q.key];
    return answers[q.key];
  }).length;
  const canProceed = (
    form.cabor_id && 
    form.venue_id && 
    form.monitoring_date && 
    (!isAdminMonev || (form.monitor_latitude && form.monitor_longitude))
  );
  const canSubmit = canProceed;

  const handleSubmit = async () => {
    const payload = { cabor_id: parseInt(form.cabor_id), venue_id: parseInt(form.venue_id),
      coach_id: form.coach_id ? parseInt(form.coach_id) : null,
      start_time: form.start_time, end_time: form.end_time,
      monitoring_date: form.monitoring_date, notes: form.notes,
      monitor_latitude: form.monitor_latitude, monitor_longitude: form.monitor_longitude,
      ...answers,
      ...Object.fromEntries(QUESTIONS.map(q => [q.key.replace(/^(q\d+)_.*/, '$1_note'), qNotes[q.key]||''])),
    };
    try { if (isEdit) await update(id, payload); else await create(payload); navigate('/monev'); } catch {}
  };

  if (isEdit && loadingDetail) return <DashboardLayout title="Loading..."><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-red-600 animate-spin" /></div></DashboardLayout>;

  const error = createError || updateError;
  const submitting = creating || updating;

  return (
    <DashboardLayout title={isEdit ? 'Edit Monitoring' : 'Buat Monitoring Baru'} subtitle="Monitoring PLATPROV Atlet Sumatera Barat">
      {isAdminMonev && !form.monitor_latitude && !geoLoading && geoError && (
        <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <MapPin className="w-6 h-6 text-red-600 mt-0.5" />
          <div><h3 className="font-bold text-red-800 mb-1">Akses Lokasi Diperlukan</h3>
            <p className="text-red-700 text-sm mb-3">{geoError}</p>
            <button onClick={requestGeo} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">Coba Lagi</button>
          </div>
        </div>
      )}
      {geoLoading && (<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3"><Loader2 className="w-5 h-5 text-blue-600 animate-spin" /><span className="text-blue-700 text-sm">Mendapatkan lokasi GPS...</span></div>)}

      {/* Stepper */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {['Info Umum', 'Checklist', 'Catatan'].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button onClick={() => (i === 0 || canProceed) && setStep(i)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${step === i ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : step > i ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {step > i ? <Check className="w-4 h-4" /> : null} {s}
            </button>
            {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300" />}
          </div>
        ))}
      </div>

      {/* Score bar */}
      <div className="mb-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center justify-between">
        <span className="text-sm text-slate-600">Skor Monitoring</span>
        <div className="flex items-center gap-3">
          <div className="w-48 h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all" style={{ width: `${(score/15)*100}%` }} />
          </div>
          <span className="text-lg font-bold text-slate-800">{score}/15</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {step === 0 && (
          <div className="p-6 space-y-5">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-red-500" /> Informasi Umum</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Cabor <span className="text-red-500">*</span></label>
                <SearchableSelect options={cabors} value={form.cabor_id} onChange={val => setForm(f => ({ ...f, cabor_id: val, coach_id: '' }))} placeholder="-- Pilih Cabor --" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Tempat Latihan <span className="text-red-500">*</span></label>
                <SearchableSelect options={venues} value={form.venue_id} onChange={val => setForm(f => ({ ...f, venue_id: val }))} placeholder="-- Pilih Venue --" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Pelatih</label>
                <SearchableSelect options={coaches} value={form.coach_id} onChange={val => setForm(f => ({ ...f, coach_id: val }))} disabled={!form.cabor_id} placeholder="-- Pilih Pelatih (opsional) --" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Monitoring <span className="text-red-500">*</span></label>
                <input type="date" value={form.monitoring_date} onChange={e => setForm(f => ({ ...f, monitoring_date: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1"><Clock className="w-4 h-4 inline mr-1" />Jam Mulai</label>
                <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1"><Clock className="w-4 h-4 inline mr-1" />Jam Selesai</label>
                <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" /></div>
            </div>
            {form.monitor_latitude && (<div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700"><MapPin className="w-4 h-4" /> Lokasi GPS: {form.monitor_latitude.toFixed(6)}, {form.monitor_longitude.toFixed(6)}</div>)}
            <div className="flex flex-col-reverse sm:flex-row justify-between pt-2 gap-3">
              <button onClick={() => navigate('/monev')} className="w-full sm:w-auto px-6 py-2.5 font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
              <button onClick={() => setStep(1)} disabled={!canProceed} className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg shadow-red-500/20">Lanjut <ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="p-6 space-y-5">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-red-500" /> Butir Monitoring</h3>
            <p className="text-sm text-slate-500">Klik toggle untuk menandai Ya/Tidak.</p>
            {GROUPS.map(g => (<div key={g} className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ backgroundColor: GROUP_COLORS[g] + '15', borderColor: GROUP_COLORS[g] + '30' }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GROUP_COLORS[g] }} /><span className="font-semibold text-sm text-slate-700">{g}</span></div>
              <div className="divide-y divide-slate-50">
                {QUESTIONS.filter(q => q.group === g).map(q => (<div key={q.key} className="px-4 py-4 flex items-start gap-3">
                  <button onClick={() => setAnswers(a => ({ ...a, [q.key]: !a[q.key] }))}
                    className={`mt-0.5 flex-shrink-0 w-12 h-7 rounded-full transition-all relative ${answers[q.key] ? 'bg-green-500' : 'bg-slate-200'}`}>
                    <div className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all" style={{ left: answers[q.key] ? '22px' : '2px' }} /></button>
                  <div className="flex-1"><p className="text-sm text-slate-700">{q.label}</p>
                    <span className={`text-xs font-medium ${answers[q.key] ? 'text-green-600' : 'text-slate-400'}`}>{answers[q.key] ? '✓ Ya' : '✗ Tidak'}</span>
                    <input type="text" placeholder="Keterangan (opsional)" value={qNotes[q.key]||''} onChange={e => setQNotes(n => ({ ...n, [q.key]: e.target.value }))}
                      className="mt-2 w-full px-3 py-2 border border-slate-100 rounded-lg text-sm focus:ring-1 focus:ring-red-100 focus:border-red-300 outline-none bg-slate-50/50" /></div>
                </div>))}
              </div>
            </div>))}
            <div className="flex flex-col-reverse sm:flex-row justify-between pt-2 gap-3">
              <div className="flex flex-col-reverse sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button onClick={() => navigate('/monev')} className="w-full sm:w-auto px-6 py-2.5 font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors sm:block">Batal</button>
                <button onClick={() => setStep(0)} className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /> Kembali</button>
              </div>
              <button onClick={() => setStep(2)} className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow-lg shadow-red-500/20">Lanjut <ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 space-y-5">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-red-500" /> Catatan & Ringkasan</h3>
            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200 text-center">
              <div className="text-4xl font-bold text-slate-800">{score}<span className="text-lg text-slate-400">/15</span></div>
              <div className="text-sm text-slate-500 mt-1">{Math.round((score/15)*100)}% tercapai</div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mt-3"><div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all" style={{ width: `${(score/15)*100}%` }} /></div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Catatan Umum</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={4} placeholder="Catatan tambahan dari pemonitor..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none" /></div>
            {error && (<div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2"><AlertCircle className="w-5 h-5 text-red-600 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>)}
            <div className="flex flex-col-reverse sm:flex-row justify-between pt-2 gap-3">
              <div className="flex flex-col-reverse sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button onClick={() => navigate('/monev')} className="w-full sm:w-auto px-6 py-2.5 font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors sm:block">Batal</button>
                <button onClick={() => setStep(1)} className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /> Kembali</button>
              </div>
              <button onClick={handleSubmit} disabled={!canSubmit || submitting} className="w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-500/20">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />} {isEdit ? 'Update Monitoring' : 'Simpan Monitoring'}</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
