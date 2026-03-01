import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ProtectedImage } from '../../components/ProtectedImage';
import { useVenues, useCreateVenue, useUpdateVenue, useDeleteVenue } from '../../hooks/queries/useVenues';

// Red marker icon
const redIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#dc2626"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

function DraggableMarker({ position, onLocationSelect }) {
  return (
    <Marker
      position={position}
      icon={redIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          onLocationSelect(lat, lng);
        },
      }}
    />
  );
}

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 16);
  }, [center, map]);
  return null;
}

export function VenuesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ name: '', address: '', latitude: 0, longitude: 0, description: '', contact: '', is_active: true });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Default center: Padang, Sumatra Barat
  const defaultCenter = [-0.9471, 100.4172];

  // Hooks
  const { data: venuesData, isLoading: loading } = useVenues({ page, search: debouncedSearch, perPage: 10 });
  const createMutation = useCreateVenue();
  const updateMutation = useUpdateVenue();
  const deleteMutation = useDeleteVenue();

  const venues = venuesData?.data || [];
  const pagination = {
    current_page: venuesData?.current_page || 1,
    last_page: venuesData?.last_page || 1,
    total: venuesData?.total || 0
  };

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const markerPosition = formData.latitude && formData.longitude
    ? [formData.latitude, formData.longitude]
    : defaultCenter;

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ name: '', address: '', latitude: 0, longitude: 0, description: '', contact: '', is_active: true });
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (venue) => {
    setModalMode('edit');
    setSelectedVenue(venue);
    setFormData({
      name: venue.name,
      address: venue.address || '',
      latitude: venue.latitude || 0,
      longitude: venue.longitude || 0,
      description: venue.description || '',
      contact: venue.contact || '',
      is_active: venue.is_active,
    });
    setPhotoFile(null);
    setPhotoPreview(venue.photo ? `/api/storage/${venue.photo}` : null);
    setIsModalOpen(true);
  };

  const handleLocationSelect = (lat, lng) => {
    setFormData(f => ({ ...f, latitude: lat, longitude: lng }));
  };

  const getLocation = () => {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setFormData(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setGettingLocation(false);
      },
      () => { setGettingLocation(false); },
      { enableHighAccuracy: true }
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('address', formData.address);
      data.append('latitude', String(formData.latitude));
      data.append('longitude', String(formData.longitude));
      data.append('description', formData.description);
      data.append('contact', formData.contact);
      data.append('is_active', formData.is_active ? 'true' : 'false');
      if (photoFile) {
        data.append('photo', photoFile);
      }
      // Keep existing photo on edit if no new photo
      if (modalMode === 'edit' && !photoFile && selectedVenue?.photo && photoPreview) {
        data.append('existing_photo', selectedVenue.photo);
      }

      if (modalMode === 'create') {
        await createMutation.mutateAsync(data);
      } else {
        await updateMutation.mutateAsync({ id: selectedVenue.id, formData: data });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save venue:', error);
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(venueToDelete.id);
      setIsDeleteModalOpen(false);
      setVenueToDelete(null);
    } catch (error) {
      setDeleteError(error.response?.data?.error || 'Gagal menghapus venue');
    }
  };

  const formLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout title="Master Venue" subtitle="Kelola data lokasi/venue latihan">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
          />
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Venue</span>
        </button>
      </div>

      {/* Venues Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
        ) : venues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <MapPin className="w-12 h-12 mb-2" />
            <p>Belum ada data venue</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-600">Venue</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-600">Alamat</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-600">Kontak</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-600">Status</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {venues.map((venue) => (
                  <tr key={venue.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {venue.photo ? (
                          <ProtectedImage src={`/api/storage/${venue.photo}`} alt={venue.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            fallback={<div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><MapPin className="w-5 h-5 text-red-500" /></div>} />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-red-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-800">{venue.name}</div>
                          {venue.description && <div className="text-xs text-slate-400 truncate max-w-xs">{venue.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 max-w-xs truncate">{venue.address || '-'}</td>
                    <td className="py-4 px-4 text-sm text-slate-500">{venue.contact || '-'}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        venue.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {venue.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(venue)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => { setVenueToDelete(venue); setIsDeleteModalOpen(true); }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Menampilkan {venues.length} dari {pagination.total} venue
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                disabled={page === pagination.last_page}
                className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">
                    {modalMode === 'create' ? 'Tambah Venue Baru' : 'Edit Venue'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Nama Venue */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Venue <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="Contoh: GOR H. Agus Salim"
                      required
                    />
                  </div>

                  {/* Alamat */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                    <textarea
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
                      rows={2}
                      placeholder="Alamat lengkap venue"
                    />
                  </div>

                  {/* Keterangan & Kontak */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                        placeholder="Lapangan indoor / outdoor, dsb"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Kontak</label>
                      <input
                        type="text"
                        value={formData.contact}
                        onChange={e => setFormData({ ...formData, contact: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Foto Venue (opsional)</label>
                    {photoPreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 group" style={{ maxHeight: 200 }}>
                        {photoPreview?.startsWith('blob:') ? (
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" style={{ maxHeight: 200 }} />
                        ) : (
                          <ProtectedImage src={photoPreview} alt="Preview" className="w-full object-cover" style={{ maxHeight: 200 }} />
                        )}
                        <button type="button" onClick={removePhoto}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-sm text-slate-400">Klik untuk upload foto</span>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Map Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">Lokasi di Peta</label>
                      <button type="button" onClick={getLocation} disabled={gettingLocation}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                        {gettingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                        Gunakan GPS
                      </button>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: 250 }}>
                      <MapContainer
                        center={markerPosition || defaultCenter}
                        zoom={markerPosition !== defaultCenter ? 16 : 13}
                        style={{ height: '100%', width: '100%' }}
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

                  {/* Latitude & Longitude Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.latitude || ''}
                        onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none font-mono text-sm"
                        placeholder="-0.9471"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.longitude || ''}
                        onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none font-mono text-sm"
                        placeholder="100.4172"
                      />
                    </div>
                  </div>

                  {/* Active checkbox */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="venue_is_active"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 accent-red-600"
                    />
                    <label htmlFor="venue_is_active" className="text-sm text-slate-700">Aktif</label>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {modalMode === 'create' ? 'Simpan' : 'Update'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => { setIsDeleteModalOpen(false); setDeleteError(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Venue?</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Anda yakin ingin menghapus venue <strong>{venueToDelete?.name}</strong>?
                </p>
                {deleteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 text-left">{deleteError}</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setIsDeleteModalOpen(false); setDeleteError(null); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
