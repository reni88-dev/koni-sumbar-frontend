import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCreateTrainingSession } from '../../hooks/queries/useTraining';
import { SearchableSelect } from '../SearchableSelect';
import { useVenuesAll } from '../../hooks/queries/useVenues';

// Red marker icon using inline SVG
const redIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#dc2626"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

// Draggable marker component
function DraggableMarker({ position, onLocationSelect }) {
  const handleDragEnd = (e) => {
    const { lat, lng } = e.target.getLatLng();
    onLocationSelect(lat, lng);
  };

  return (
    <Marker
      position={position}
      icon={redIcon}
      draggable={true}
      eventHandlers={{ dragend: handleDragEnd }}
    />
  );
}

// Component to re-center map when GPS is used
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 16);
    }
  }, [center, map]);
  return null;
}

export function CreateTrainingModal({ onClose, cabors, coaches, isCoach, myCoachId }) {
  const create = useCreateTrainingSession();
  const { data: venues = [] } = useVenuesAll();
  const [venueMode, setVenueMode] = useState('select'); // 'select' | 'manual'
  const [form, setForm] = useState({
    title: '', description: '', training_date: '', start_time: '', end_time: '',
    location_name: '', latitude: 0, longitude: 0,
    coach_id: isCoach ? myCoachId : '',
    cabor_id: '',
  });
  const [gettingLocation, setGettingLocation] = useState(false);

  // Default center: Padang, Sumatra Barat
  const defaultCenter = [-0.9471, 100.4172];
  const markerPosition = form.latitude && form.longitude
    ? [form.latitude, form.longitude]
    : defaultCenter;

  const venueOptions = [
    ...venues.map(v => ({ id: v.id, name: v.name })),
    { id: '__other__', name: '➕ Lainnya (input manual)' },
  ];

  const handleVenueChange = (value) => {
    if (value === '__other__') {
      setVenueMode('manual');
      setForm(f => ({ ...f, location_name: '', latitude: 0, longitude: 0 }));
    } else if (value) {
      const venue = venues.find(v => v.id === Number(value));
      if (venue) {
        setVenueMode('select');
        setForm(f => ({
          ...f,
          location_name: venue.name,
          latitude: venue.latitude || 0,
          longitude: venue.longitude || 0,
        }));
      }
    } else {
      setVenueMode('select');
      setForm(f => ({ ...f, location_name: '', latitude: 0, longitude: 0 }));
    }
  };

  const selectedVenueId = venueMode === 'manual'
    ? '__other__'
    : venues.find(v => v.name === form.location_name)?.id || '';

  const handleLocationSelect = (lat, lng) => {
    setForm(f => ({ ...f, latitude: lat, longitude: lng }));
  };

  const getLocation = () => {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setGettingLocation(false);
      },
      () => { setGettingLocation(false); },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async () => {
    const data = { ...form, coach_id: Number(form.coach_id), cabor_id: Number(form.cabor_id) };
    try {
      await create.mutateAsync(data);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal membuat sesi latihan');
    }
  };

  const isValid = form.title && form.training_date && form.location_name && form.latitude && form.longitude && form.coach_id && form.cabor_id;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Buat Jadwal Latihan</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Judul Latihan <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" placeholder="Latihan rutin hari Senin" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!isCoach && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pelatih <span className="text-red-500">*</span></label>
                  <select value={form.coach_id} onChange={e => setForm(f => ({ ...f, coach_id: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none">
                    <option value="">Pilih Pelatih</option>
                    {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cabor <span className="text-red-500">*</span></label>
                <select value={form.cabor_id} onChange={e => setForm(f => ({ ...f, cabor_id: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none">
                  <option value="">Pilih Cabor</option>
                  {cabors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal <span className="text-red-500">*</span></label>
                <input type="date" value={form.training_date} onChange={e => setForm(f => ({ ...f, training_date: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mulai</label>
                <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Selesai</label>
                <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" />
              </div>
            </div>

            {/* Venue Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi / Venue <span className="text-red-500">*</span></label>
              <SearchableSelect
                options={venueOptions}
                value={String(selectedVenueId)}
                onChange={handleVenueChange}
                placeholder="Pilih Venue"
              />
            </div>

            {/* Manual location input (shown when "Lainnya" is selected) */}
            {venueMode === 'manual' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lokasi <span className="text-red-500">*</span></label>
                <input type="text" value={form.location_name} onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" placeholder="Lapangan Imam Bonjol Padang" />
              </div>
            )}

            {/* Map Picker — show when manual mode OR when venue has no coordinates */}
            {(venueMode === 'manual' || (venueMode === 'select' && selectedVenueId && (!form.latitude || !form.longitude))) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Lokasi di Peta <span className="text-red-500">*</span></label>
                  <button type="button" onClick={getLocation} disabled={gettingLocation}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                    {gettingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                    Gunakan GPS
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: 250 }}>
                  <MapContainer
                    center={markerPosition || defaultCenter}
                    zoom={markerPosition ? 16 : 13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <DraggableMarker position={markerPosition} onLocationSelect={handleLocationSelect} />
                    <MapRecenter center={markerPosition} />
                  </MapContainer>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Geser pin merah atau isi koordinat di bawah</p>
              </div>
            )}

            {/* Latitude & Longitude Inputs — shown in manual mode */}
            {venueMode === 'manual' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                  <input type="number" step="any" value={form.latitude || ''}
                    onChange={e => setForm(f => ({ ...f, latitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none font-mono text-sm"
                    placeholder="-0.9471" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                  <input type="number" step="any" value={form.longitude || ''}
                    onChange={e => setForm(f => ({ ...f, longitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none font-mono text-sm"
                    placeholder="100.4172" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none" rows={2} placeholder="Catatan latihan..." />
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
            <button onClick={handleSubmit} disabled={!isValid || create.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {create.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
