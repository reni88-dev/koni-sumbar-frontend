import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, MapPin, Loader2, Calendar, Clock, Trophy, User, Building2, Edit2, X } from 'lucide-react';
import { ProtectedImage } from '../components/ProtectedImage';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DashboardLayout } from '../components/DashboardLayout';
import { useMonevSubmissionDetail } from '../hooks/useMonev';
import { useAuth } from '../hooks/useAuth';

const greenIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#16a34a"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`),
  iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -36],
});

const GROUP_COLORS = { 'Umum': '#3b82f6', 'Kehadiran & Jadwal': '#3b82f6', 'Sarana & Prasarana': '#10b981', 'Program Latihan': '#8b5cf6', 'Komunikasi & Keamanan': '#f59e0b', 'Nutrisi & Suplemen': '#f97316', 'Kendala': '#ef4444', 'Disiplin': '#22c55e' };
const getGroupColor = (name) => GROUP_COLORS[name] || '#3b82f6';

export default function MonevDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error } = useMonevSubmissionDetail(id);
  const isAdminMonev = user?.role?.name === 'admin_monev';
  const canSeeMap = !isAdminMonev;
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevPhoto = useCallback(() => setLightboxIndex(i => (i - 1 + (data?.photos?.length || 1)) % (data?.photos?.length || 1)), [data]);
  const nextPhoto = useCallback(() => setLightboxIndex(i => (i + 1) % (data?.photos?.length || 1)), [data]);

  useEffect(() => {
    const handleKey = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, closeLightbox, prevPhoto, nextPhoto]);

  if (loading) return <DashboardLayout title="Loading..."><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-red-600 animate-spin" /></div></DashboardLayout>;
  if (error || !data) return <DashboardLayout title="Error"><div className="flex flex-col items-center justify-center h-64 text-slate-400"><p>{error || 'Data tidak ditemukan'}</p><button onClick={() => navigate('/monev')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl">Kembali</button></div></DashboardLayout>;

  const score = data.total_score || 0;
  const totalItems = data.total_items || 1;
  const pct = Math.round((score / totalItems) * 100);

  const groupedAnswers = {};
  if (data.answers) {
    data.answers.forEach(ans => {
      if (!groupedAnswers[ans.group_name]) groupedAnswers[ans.group_name] = [];
      groupedAnswers[ans.group_name].push(ans);
    });
  }

  return (
    <DashboardLayout title="Detail Monitoring" subtitle={`${data.cabor_name} — ${new Date(data.monitoring_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}>
      <button onClick={() => navigate('/monev')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm"><ChevronLeft className="w-4 h-4" /> Kembali ke daftar</button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
            <div className="text-5xl font-bold text-slate-800">{score}<span className="text-xl text-slate-400">/{totalItems}</span></div>
            <div className="text-sm text-slate-500 mt-1">{pct}% tercapai</div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-4">
              <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3"><Trophy className="w-5 h-5 text-red-500" /><div><div className="text-xs text-slate-400">Event Monev</div><div className="font-medium text-slate-700">{data.event_name}</div></div></div>
            <div className="flex items-center gap-3"><Building2 className="w-5 h-5 text-blue-500" /><div><div className="text-xs text-slate-400">Cabor</div><div className="font-medium text-slate-700">{data.cabor_name}</div></div></div>
            <div className="flex items-center gap-3"><Building2 className="w-5 h-5 text-indigo-500" /><div><div className="text-xs text-slate-400">Venue</div><div className="font-medium text-slate-700">{data.venue_name}</div></div></div>
            {data.coach_name && <div className="flex items-center gap-3"><User className="w-5 h-5 text-green-500" /><div><div className="text-xs text-slate-400">Pelatih</div><div className="font-medium text-slate-700">{data.coach_name}</div></div></div>}
            <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-violet-500" /><div><div className="text-xs text-slate-400">Tanggal</div><div className="font-medium text-slate-700">{new Date(data.monitoring_date).toLocaleDateString('id-ID')}</div></div></div>
            {data.start_time && <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-amber-500" /><div><div className="text-xs text-slate-400">Jam Latihan</div><div className="font-medium text-slate-700">{data.start_time} - {data.end_time}</div></div></div>}
            <div className="flex items-center gap-3"><User className="w-5 h-5 text-slate-400" /><div><div className="text-xs text-slate-400">Pemonitor</div><div className="font-medium text-slate-700">{data.creator_name}</div></div></div>
            
            {data.companions && data.companions.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-400 mb-2">Pendamping</div>
                <div className="space-y-2">
                  {data.companions.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">{c.name.charAt(0)}</div>
                      <div>
                        <div className="text-sm font-medium text-slate-700 leading-none">{c.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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

          <button onClick={() => navigate(`/monev/submissions/${id}/edit`)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"><Edit2 className="w-4 h-4" /> Edit Monitoring</button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {Object.entries(groupedAnswers).map(([g, answers]) => (
            <div key={g} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ backgroundColor: getGroupColor(g) + '12', borderColor: getGroupColor(g) + '25' }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getGroupColor(g) }} />
                <span className="font-semibold text-sm text-slate-700">{g}</span>
              </div>
              <div className="divide-y divide-slate-50">
                {answers.map(ans => {
                  const isGood = ans.is_negative ? !ans.answer_value : ans.answer_value;

                  return (
                    <div key={ans.id} className="px-5 py-4 flex items-start gap-3">
                      {isGood ? <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm ${isGood ? 'text-slate-700' : 'text-slate-500'}`}>{ans.question}</p>
                          {ans.is_negative && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600">Logika Negatif</span>}
                        </div>
                        {ans.note && <p className="text-xs text-slate-400 mt-1 italic">📝 {ans.note}</p>}
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${isGood ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>{ans.answer_value ? 'Ya' : 'Tidak'}</span>
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

          {data.photos && data.photos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h4 className="font-semibold text-slate-700 mb-3">📷 Foto Dokumentasi</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.photos.map((path, i) => (
                  <button key={i} type="button" onClick={() => setLightboxIndex(i)}
                    className="block aspect-square rounded-xl overflow-hidden border border-slate-200 hover:ring-2 hover:ring-red-400 transition-all group">
                    <ProtectedImage
                      src={`/api/storage/${encodeURIComponent(path)}`}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {lightboxIndex !== null && data.photos?.length > 0 && (
            <div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={closeLightbox}
            >
              <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                <button onClick={closeLightbox}
                  className="absolute -top-12 right-0 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10">
                  <X className="w-7 h-7" />
                </button>

                <div className="absolute -top-12 left-0 text-white/70 text-sm font-medium py-2">
                  {lightboxIndex + 1} / {data.photos.length}
                </div>

                <div className="rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center" style={{ maxHeight: '80vh' }}>
                  <ProtectedImage
                    src={`/api/storage/${encodeURIComponent(data.photos[lightboxIndex])}`}
                    alt={`Foto ${lightboxIndex + 1}`}
                    className="max-h-[80vh] w-auto max-w-full object-contain"
                  />
                </div>

                {data.photos.length > 1 && (
                  <>
                    <button onClick={prevPhoto}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full backdrop-blur-sm transition-colors">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={nextPhoto}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full backdrop-blur-sm transition-colors">
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                {data.photos.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {data.photos.map((_, i) => (
                      <button key={i} onClick={() => setLightboxIndex(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          i === lightboxIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
