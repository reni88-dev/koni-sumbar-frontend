import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Calendar,
  X,
  Loader2,
  AlertCircle,
  Users,
  MapPin,
  Eye,
  Upload
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '../hooks/queries/useEvents';

export function EventsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '', type: 'provincial', year: new Date().getFullYear(), location: '',
    start_date: '', end_date: '', description: '',
    registration_start: '', registration_end: '', is_active: true
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const typeLabels = { provincial: 'Provinsi', national: 'Nasional', international: 'Internasional' };
  const typeColors = { 
    provincial: 'bg-blue-100 text-blue-700', 
    national: 'bg-green-100 text-green-700', 
    international: 'bg-purple-100 text-purple-700' 
  };

  // TanStack Query hooks
  const { 
    data: eventsData, 
    isLoading: loading 
  } = useEvents({ 
    page, 
    search: debouncedSearch, 
    perPage: 9 
  });

  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();

  const events = eventsData?.data || [];
  const pagination = {
    current_page: eventsData?.current_page || 1,
    last_page: eventsData?.last_page || 1,
    total: eventsData?.total || 0
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filterType]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      name: '', type: 'provincial', year: new Date().getFullYear(), location: '',
      start_date: '', end_date: '', description: '',
      registration_start: '', registration_end: '', is_active: true
    });
    setLogoFile(null);
    setLogoPreview(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Helper to format date for input type="date" (YYYY-MM-DD)
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  const openEditModal = (event) => {
    setModalMode('edit');
    setSelectedEvent(event);
    setFormData({
      name: event.name,
      type: event.type,
      year: event.year,
      location: event.location || '',
      start_date: formatDateForInput(event.start_date),
      end_date: formatDateForInput(event.end_date),
      description: event.description || '',
      registration_start: formatDateForInput(event.registration_start),
      registration_end: formatDateForInput(event.registration_end),
      is_active: event.is_active
    });
    setLogoFile(null);
    setLogoPreview(event.logo ? `${import.meta.env.VITE_API_URL}/storage/${event.logo}` : null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null) {
          data.append(key, key === 'is_active' ? (value ? '1' : '0') : value);
        }
      });
      if (logoFile) data.append('logo', logoFile);

      if (modalMode === 'create') {
        await createEventMutation.mutateAsync(data);
      } else {
        await updateEventMutation.mutateAsync({ id: selectedEvent.id, formData: data });
      }
      setIsModalOpen(false);
    } catch (error) {
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors || {});
      }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEventMutation.mutateAsync(eventToDelete.id);
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formLoading = createEventMutation.isPending || updateEventMutation.isPending;

  return (
    <DashboardLayout title="Event Olahraga" subtitle="Kelola event dan pertandingan olahraga">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none w-64"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
          >
            <option value="">Semua Tipe</option>
            <option value="provincial">Provinsi</option>
            <option value="national">Nasional</option>
            <option value="international">Internasional</option>
          </select>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Event</span>
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
          </div>
        ) : events.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            Tidak ada data event
          </div>
        ) : (
          events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-32 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center relative">
                {event.logo ? (
                  <img 
                    src={`${import.meta.env.VITE_API_URL}/storage/${event.logo}`}
                    alt={event.name}
                    className="h-20 w-20 object-contain bg-white rounded-xl p-2"
                  />
                ) : (
                  <Calendar className="w-12 h-12 text-white/80" />
                )}
                <span className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium ${typeColors[event.type]}`}>
                  {typeLabels[event.type]}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1">{event.name}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location || '-'}</span>
                </div>
                <div className="text-sm text-slate-500 mb-4">
                  📅 {formatDate(event.start_date)} - {formatDate(event.end_date)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Users className="w-4 h-4" />
                    <span>{event.athletes_count || 0} Atlet</span>
                  </div>
                  <div className="flex gap-1">
                    <Link
                      to={`/event/${event.id}`}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => openEditModal(event)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEventToDelete(event); setIsDeleteModalOpen(true); }}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: pagination.last_page }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                pagination.current_page === i + 1
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">
                    {modalMode === 'create' ? 'Tambah Event Baru' : 'Edit Event'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Logo */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-red-50 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-red-200">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
                      ) : (
                        <Calendar className="w-8 h-8 text-red-300" />
                      )}
                    </div>
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">Upload Logo</span>
                      <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    </label>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nama Event</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                        placeholder="Porprov Sumbar 2026"
                        required
                      />
                      {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name[0]}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Event</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      >
                        <option value="provincial">Provinsi</option>
                        <option value="national">Nasional</option>
                        <option value="international">Internasional</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
                      <input
                        type="number"
                        value={formData.year}
                        onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                        min={2000}
                        max={2100}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                        placeholder="Padang, Sumatera Barat"
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={e => setFormData({...formData, start_date: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Selesai</label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={e => setFormData({...formData, end_date: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Registration Period */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Buka Pendaftaran</label>
                      <input
                        type="date"
                        value={formData.registration_start}
                        onChange={e => setFormData({...formData, registration_start: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tutup Pendaftaran</label>
                      <input
                        type="date"
                        value={formData.registration_end}
                        onChange={e => setFormData({...formData, registration_end: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
                      rows={3}
                      placeholder="Deskripsi event..."
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 accent-red-600"
                    />
                    <label htmlFor="is_active" className="text-sm text-slate-700">Aktif</label>
                  </div>

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
              onClick={() => setIsDeleteModalOpen(false)}
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
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Event?</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Anda yakin ingin menghapus event <strong>{eventToDelete?.name}</strong>?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteEventMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteEventMutation.isPending ? 'Menghapus...' : 'Hapus'}
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
