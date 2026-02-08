import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Loader2, 
  Upload,
  User,
  AlertCircle
} from 'lucide-react';
import api from '../api/axios';

const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];
const GENDERS = [
  { value: 'male', label: 'Laki-laki' },
  { value: 'female', label: 'Perempuan' }
];
const LICENSE_LEVELS = ['Nasional', 'Daerah', 'Internasional'];

// Helper to format date for input type="date" (YYYY-MM-DD)
function formatDateForInput(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export function CoachFormModal({ isOpen, onClose, coach, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    cabor_id: '',
    birth_place: '',
    birth_date: '',
    gender: '',
    religion: '',
    address: '',
    phone: '',
    email: '',
    license_number: '',
    license_level: '',
    coaching_start_year: '',
    specialization: '',
    achievements: '',
    is_active: true
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [cabors, setCabors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (coach) {
        // Edit mode - populate form with existing data
        setFormData({
          name: coach.name || '',
          nik: coach.nik || '',
          cabor_id: coach.cabor_id || coach.cabor?.id || '',
          birth_place: coach.birth_place || '',
          birth_date: formatDateForInput(coach.birth_date),
          gender: coach.gender || '',
          religion: coach.religion || '',
          address: coach.address || '',
          phone: coach.phone || '',
          email: coach.email || '',
          license_number: coach.license_number || '',
          license_level: coach.license_level || '',
          coaching_start_year: coach.coaching_start_year || '',
          specialization: coach.specialization || '',
          achievements: typeof coach.achievements === 'string' 
            ? coach.achievements 
            : (coach.achievements ? JSON.stringify(coach.achievements) : ''),
          is_active: coach.is_active ?? true
        });
        if (coach.photo) {
          setPhotoPreview(`/api/coaches/${coach.id}/photo?t=${Date.now()}`);
        }
      } else {
        // Create mode - reset form
        setFormData({
          name: '',
          nik: '',
          cabor_id: '',
          birth_place: '',
          birth_date: '',
          gender: '',
          religion: '',
          address: '',
          phone: '',
          email: '',
          license_number: '',
          license_level: '',
          coaching_start_year: '',
          specialization: '',
          achievements: '',
          is_active: true
        });
        setPhotoPreview('');
      }
      setPhoto(null);
      setError('');
      fetchCabors();
    }
  }, [isOpen, coach]);

  const fetchCabors = async () => {
    try {
      const response = await api.get('/api/master/cabors?all=true');
      setCabors(response.data.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch cabors:', err);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      
      // Append all fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (key === 'is_active') {
            data.append(key, value ? 'true' : 'false');
          } else {
            data.append(key, value);
          }
        }
      });

      // Append photo if selected
      if (photo) {
        data.append('photo', photo);
      }

      if (coach) {
        // Update existing coach
        await api.put(`/api/coaches/${coach.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Create new coach
        await api.post('/api/coaches', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to save coach:', err);
      setError(err.response?.data?.message || 'Gagal menyimpan data pelatih');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {coach ? 'Edit Pelatih' : 'Tambah Pelatih Baru'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {error && (
              <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm border border-red-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo Upload */}
              <div className="md:col-span-2 flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-slate-300" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-red-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-red-700 transition-colors">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                  required
                />
              </div>

              {/* NIK */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIK</label>
                <input
                  type="text"
                  value={formData.nik}
                  onChange={(e) => updateField('nik', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                  maxLength={16}
                />
              </div>

              {/* Cabor */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cabang Olahraga *</label>
                <select
                  value={formData.cabor_id}
                  onChange={(e) => updateField('cabor_id', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                  required
                >
                  <option value="">Pilih Cabor</option>
                  {cabors.map((cabor) => (
                    <option key={cabor.id} value={cabor.id}>{cabor.name}</option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kelamin</label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              {/* Birth Place */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tempat Lahir</label>
                <input
                  type="text"
                  value={formData.birth_place}
                  onChange={(e) => updateField('birth_place', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => updateField('birth_date', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                />
              </div>

              {/* Religion */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Agama</label>
                <select
                  value={formData.religion}
                  onChange={(e) => updateField('religion', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                >
                  <option value="">Pilih Agama</option>
                  {RELIGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">No. Telepon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
                />
              </div>

              {/* License Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Lisensi</label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => updateField('license_number', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                />
              </div>

              {/* License Level */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Level Lisensi</label>
                <select
                  value={formData.license_level}
                  onChange={(e) => updateField('license_level', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                >
                  <option value="">Pilih Level</option>
                  {LICENSE_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Coaching Start Year */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Mulai Melatih</label>
                <input
                  type="number"
                  value={formData.coaching_start_year}
                  onChange={(e) => updateField('coaching_start_year', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                  min={1950}
                  max={new Date().getFullYear()}
                />
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Spesialisasi</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => updateField('specialization', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                  placeholder="Contoh: Teknik, Fisik, Mental"
                />
              </div>

              {/* Achievements */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Prestasi Kepelatihan</label>
                <textarea
                  value={formData.achievements}
                  onChange={(e) => updateField('achievements', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
                  placeholder="Daftar prestasi yang pernah diraih..."
                />
              </div>

              {/* Is Active */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => updateField('is_active', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Pelatih Aktif</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {coach ? 'Simpan Perubahan' : 'Tambah Pelatih'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
