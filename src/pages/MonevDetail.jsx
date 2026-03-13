import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, XCircle, MapPin, Loader2, Calendar, Clock, Trophy, User, Building2, Edit2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DashboardLayout } from '../components/DashboardLayout';
import { useMonevDetail } from '../hooks/useMonev';
import { useAuth } from '../hooks/useAuth';

const greenIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#16a34a"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`),
  iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -36],
});

const QUESTIONS = [
  { key: 'q1_attendance', noteKey: 'q1_note', label: 'Apakah atlet dan pelatih hadir pada sesi latihan?', group: 'Kehadiran & Jadwal' },
  { key: 'q2_schedule', noteKey: 'q2_note', label: 'Apakah latihan dimulai sesuai jadwal yang telah ditetapkan?', group: 'Kehadiran & Jadwal' },
  { key: 'q3_facilities', noteKey: 'q3_note', label: 'Apakah sarana dan prasarana latihan tersedia dan siap digunakan?', group: 'Sarana & Prasarana' },
  { key: 'q8_venue_readiness', noteKey: 'q8_note', label: 'Apakah tempat latihan dikelola dan dipersiapkan dengan baik?', group: 'Sarana & Prasarana' },
  { key: 'q4_material', noteKey: 'q4_note', label: 'Apakah materi latihan sesuai program yang direncanakan?', group: 'Program Latihan' },
  { key: 'q5_intensity', noteKey: 'q5_note', label: 'Apakah intensitas latihan sesuai tujuan latihan?', group: 'Program Latihan' },
  { key: 'q6_execution', noteKey: 'q6_note', label: 'Apakah atlet melaksanakan gerakan sesuai instruksi pelatih?', group: 'Program Latihan' },
  { key: 'q7_target', noteKey: 'q7_note', label: 'Apakah target latihan sesi ini tercapai?', group: 'Program Latihan' },
  { key: 'q9_communication', noteKey: 'q9_note', label: 'Apakah pelatih berkomunikasi dengan baik selama latihan?', group: 'Komunikasi & Keamanan' },
  { key: 'q10_security', noteKey: 'q10_note', label: 'Apakah pengawasan keamanan dilakukan selama latihan?', group: 'Komunikasi & Keamanan' },
  { key: 'q11_nutrition', noteKey: 'q11_note', label: 'Apakah menu makanan bagi atlet tersedia dengan cukup?', group: 'Nutrisi & Suplemen' },
  { key: 'q14_supplements', noteKey: 'q14_note', label: 'Apakah suplemen bagi atlet tersedia?', group: 'Nutrisi & Suplemen' },
  { key: 'q12_athlete_issues', noteKey: 'q12_note', label: 'Apakah terdapat kendala yang dialami atlet?', group: 'Kendala' },
  { key: 'q13_coach_issues', noteKey: 'q13_note', label: 'Apakah terdapat kendala yang dialami pelatih?', group: 'Kendala' },
  { key: 'q15_discipline', noteKey: 'q15_note', label: 'Apakah atlet disiplin menjaga berat badan idealnya?', group: 'Disiplin' },
];

const GROUPS = [...new Set(QUESTIONS.map(q => q.group))];
const GROUP_COLORS = { 'Kehadiran & Jadwal': '#3b82f6', 'Sarana & Prasarana': '#10b981', 'Program Latihan': '#8b5cf6', 'Komunikasi & Keamanan': '#f59e0b', 'Nutrisi & Suplemen': '#f97316', 'Kendala': '#ef4444', 'Disiplin': '#22c55e' };

export default function MonevDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error } = useMonevDetail(id);
  const isAdminMonev = user?.role?.name === 'admin_monev';
  const canSeeMap = !isAdminMonev;

  if (loading) return <DashboardLayout title="Loading..."><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-red-600 animate-spin" /></div></DashboardLayout>;
  if (error || !data) return <DashboardLayout title="Error"><div className="flex flex-col items-center justify-center h-64 text-slate-400"><p>{error || 'Data tidak ditemukan'}</p><button onClick={() => navigate('/monev')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl">Kembali</button></div></DashboardLayout>;

  const score = data.total_score || 0;
  const pct = Math.round((score / 15) * 100);

  return (
    <DashboardLayout title="Detail Monitoring" subtitle={`${data.cabor_name} — ${new Date(data.monitoring_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}>
      {/* Back button */}
      <button onClick={() => navigate('/monev')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm"><ChevronLeft className="w-4 h-4" /> Kembali ke daftar</button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info + Score */}
        <div className="space-y-6">
          {/* Score Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
            <div className="text-5xl font-bold text-slate-800">{score}<span className="text-xl text-slate-400">/15</span></div>
            <div className="text-sm text-slate-500 mt-1">{pct}% tercapai</div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-4">
              <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3"><Trophy className="w-5 h-5 text-red-500" /><div><div className="text-xs text-slate-400">Cabor</div><div className="font-medium text-slate-700">{data.cabor_name}</div></div></div>
            <div className="flex items-center gap-3"><Building2 className="w-5 h-5 text-blue-500" /><div><div className="text-xs text-slate-400">Venue</div><div className="font-medium text-slate-700">{data.venue_name}</div></div></div>
            {data.coach_name && <div className="flex items-center gap-3"><User className="w-5 h-5 text-green-500" /><div><div className="text-xs text-slate-400">Pelatih</div><div className="font-medium text-slate-700">{data.coach_name}</div></div></div>}
            <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-violet-500" /><div><div className="text-xs text-slate-400">Tanggal</div><div className="font-medium text-slate-700">{new Date(data.monitoring_date).toLocaleDateString('id-ID')}</div></div></div>
            {data.training_time && <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-amber-500" /><div><div className="text-xs text-slate-400">Jam Latihan</div><div className="font-medium text-slate-700">{data.training_time}</div></div></div>}
            <div className="flex items-center gap-3"><User className="w-5 h-5 text-slate-400" /><div><div className="text-xs text-slate-400">Pemonitor</div><div className="font-medium text-slate-700">{data.creator_name}</div></div></div>
          </div>

          {/* Map for admin/superadmin */}
          {canSeeMap && data.monitor_latitude && data.monitor_longitude && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2"><MapPin className="w-5 h-5 text-green-600" /><span className="font-semibold text-sm text-slate-700">Lokasi Pemonitor</span></div>
              <div style={{ height: 220 }}>
                <MapContainer center={[data.monitor_latitude, data.monitor_longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[data.monitor_latitude, data.monitor_longitude]} icon={greenIcon}>
                    <Popup>Lokasi pemonitor saat monitoring</Popup>
                  </Marker>
                </MapContainer>
              </div>
              {data.location_url && <a href={data.location_url} target="_blank" rel="noopener noreferrer" className="block p-3 text-center text-sm text-blue-600 hover:bg-blue-50 transition-colors">Buka di Google Maps →</a>}
            </div>
          )}

          <button onClick={() => navigate(`/monev/${id}/edit`)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"><Edit2 className="w-4 h-4" /> Edit Monitoring</button>
        </div>

        {/* Right: Checklist */}
        <div className="lg:col-span-2 space-y-4">
          {GROUPS.map(g => (
            <div key={g} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ backgroundColor: GROUP_COLORS[g] + '12', borderColor: GROUP_COLORS[g] + '25' }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GROUP_COLORS[g] }} />
                <span className="font-semibold text-sm text-slate-700">{g}</span>
              </div>
              <div className="divide-y divide-slate-50">
                {QUESTIONS.filter(q => q.group === g).map(q => {
                  const val = data[q.key];
                  const note = data[q.noteKey];
                  const isKendala = q.group === 'Kendala';
                  const isGood = isKendala ? !val : val;

                  return (
                    <div key={q.key} className="px-5 py-4 flex items-start gap-3">
                      {isGood ? <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />}
                      <div className="flex-1">
                        <p className={`text-sm ${isGood ? 'text-slate-700' : 'text-slate-500'}`}>{q.label}</p>
                        {note && <p className="text-xs text-slate-400 mt-1 italic">📝 {note}</p>}
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${isGood ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>{val ? 'Ya' : 'Tidak'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {data.notes && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h4 className="font-semibold text-slate-700 mb-2">📋 Catatan Umum</h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
