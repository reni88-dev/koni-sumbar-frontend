import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Loader2, 
  Upload,
  User,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle
} from 'lucide-react';
import api from '../api/axios';
import ProtectedImage from './ProtectedImage';
import { SearchableSelect } from './SearchableSelect';

const STEPS = [
  { id: 1, title: 'Data Pribadi' },
  { id: 2, title: 'Info Fisik & Kontak' },
  { id: 3, title: 'Karir & Prestasi' }
];

const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const MARITAL_STATUSES = [
  { value: 'single', label: 'Belum Menikah' },
  { value: 'married', label: 'Menikah' },
  { value: 'divorced', label: 'Cerai' },
  { value: 'widowed', label: 'Duda/Janda' }
];

// Helper to format date for input type="date" (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  // Handle ISO format (2000-01-15T00:00:00.000000Z) - extract date part directly
  // This avoids timezone conversion issues
  const match = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  return '';
};

export function AthleteFormModal({ isOpen, onClose, athlete, onSuccess }) {
  const formContainerRef = useRef(null);
  const [step, setStep] = useState(1);
  const [cabors, setCabors] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [competitionClasses, setCompetitionClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    cabor_id: '', organization_id: '', education_level_id: '', competition_class_id: '', name: '', nik: '', no_kk: '',
    birth_place: '', birth_date: '', gender: '',
    religion: '', address: '', blood_type: '', occupation: '',
    marital_status: '', hobby: '', height: '', weight: '', phone: '', email: '',
    career_start_year: '', injury_illness_history: '',
    top_achievements: ['', '', ''],
    is_active: true
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchCabors();
      fetchOrganizations();
      fetchEducationLevels();
      setStep(1);
      setErrors({});
      
      if (athlete) {
        // Fetch competition classes for the athlete's cabor
        if (athlete.cabor_id) {
          fetchCompetitionClasses(athlete.cabor_id);
        }
        
        setFormData({
          cabor_id: athlete.cabor_id?.toString() || '',
          organization_id: athlete.organization_id?.toString() || '',
          education_level_id: athlete.education_level_id?.toString() || '',
          competition_class_id: athlete.competition_class_id?.toString() || '',
          name: athlete.name || '',
          nik: athlete.nik || '',
          no_kk: athlete.no_kk || '',
          birth_place: athlete.birth_place || '',
          birth_date: formatDateForInput(athlete.birth_date),
          gender: athlete.gender || '',
          religion: athlete.religion || '',
          address: athlete.address || '',
          blood_type: athlete.blood_type || '',
          occupation: athlete.occupation || '',
          marital_status: athlete.marital_status || '',
          hobby: athlete.hobby || '',
          height: athlete.height || '',
          weight: athlete.weight || '',
          phone: athlete.phone || '',
          email: athlete.email || '',
          career_start_year: athlete.career_start_year || '',
          injury_illness_history: athlete.injury_illness_history || '',
          top_achievements: [
            athlete.top_achievements?.[0] || '',
            athlete.top_achievements?.[1] || '',
            athlete.top_achievements?.[2] || ''
          ],
          is_active: athlete.is_active ?? true
        });
        setPhotoPreview(athlete.photo || null);
      } else {
        setCompetitionClasses([]);
        setFormData({
          cabor_id: '', organization_id: '', education_level_id: '', competition_class_id: '', name: '', nik: '', no_kk: '',
          birth_place: '', birth_date: '', gender: '',
          religion: '', address: '', blood_type: '', occupation: '',
          marital_status: '', hobby: '', height: '', weight: '', phone: '', email: '',
          career_start_year: '', injury_illness_history: '',
          top_achievements: ['', '', ''],
          is_active: true
        });
        setPhotoFile(null);
        setPhotoPreview(null);
      }
    }
  }, [isOpen, athlete]);

  const fetchCabors = async () => {
    try {
      const res = await api.get('/api/cabors/all');
      // Ensure data is array and has valid IDs
      const data = Array.isArray(res.data) ? res.data.filter(item => item && item.id) : [];
      setCabors(data);
    } catch (e) { 
      console.error('Failed to fetch cabors:', e);
      setCabors([]);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const res = await api.get('/api/organizations/all');
      const data = Array.isArray(res.data) ? res.data.filter(item => item && item.id) : [];
      setOrganizations(data);
    } catch (e) {
      console.error('Failed to fetch organizations:', e);
      setOrganizations([]);
    }
  };

  const fetchEducationLevels = async () => {
    try {
      const res = await api.get('/api/education-levels/all');
      // Ensure data is array and has valid IDs
      const data = Array.isArray(res.data) ? res.data.filter(item => item && item.id) : [];
      setEducationLevels(data);
    } catch (e) { 
      console.error('Failed to fetch education levels:', e);
      setEducationLevels([]);
    }
  };

  const fetchCompetitionClasses = async (caborId) => {
    if (!caborId) {
      setCompetitionClasses([]);
      return;
    }
    try {
      // Use query string directly to ensure parameter is sent
      const res = await api.get(`/api/competition-classes/all?cabor_id=${caborId}`);
      // Ensure data is an array and filter out any items without valid id
      const data = Array.isArray(res.data) ? res.data.filter(c => c && c.id) : [];
      setCompetitionClasses(data);
    } catch (e) { 
      console.error('Failed to fetch competition classes:', e);
      setCompetitionClasses([]);
    }
  };

  // Handle cabor change - fetch competition classes for selected cabor
  const handleCaborChange = (caborId) => {
    updateField('cabor_id', caborId);
    updateField('competition_class_id', ''); // Reset competition class
    fetchCompetitionClasses(caborId);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAchievement = (index, value) => {
    const newAchievements = [...formData.top_achievements];
    newAchievements[index] = value;
    setFormData(prev => ({ ...prev, top_achievements: newAchievements }));
  };

  // Validate current step - all fields are required
  const isStepValid = () => {
    if (step === 1) {
      // Step 1: Data Pribadi
      return (
        formData.name.trim() !== '' &&
        formData.nik.trim() !== '' &&
        formData.no_kk.trim() !== '' &&
        formData.birth_place.trim() !== '' &&
        formData.birth_date !== '' &&
        formData.gender !== '' &&
        formData.religion !== '' &&
        formData.cabor_id !== '' &&
        formData.competition_class_id !== '' &&
        formData.address.trim() !== ''
      );
    }
    if (step === 2) {
      // Step 2: Info Fisik & Kontak
      return (
        formData.height !== '' &&
        formData.weight !== '' &&
        formData.blood_type !== '' &&
        formData.education_level_id !== '' &&
        formData.occupation.trim() !== '' &&
        formData.marital_status !== '' &&
        formData.phone.trim() !== '' &&
        formData.email.trim() !== ''
      );
    }
    // Step 3: Karir & Prestasi (prestasi optional)
    return formData.career_start_year !== '';
  };

  // Go to next step with scroll to top
  const goToNextStep = () => {
    if (isStepValid() && step < 3) {
      setStep(step + 1);
      // Scroll form container to top
      setTimeout(() => {
        formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  // Go to previous step with scroll to top
  const goToPrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setTimeout(() => {
        formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    setErrorMessage('');

    try {
      const data = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'top_achievements') {
          // Filter out empty strings and send as JSON
          const filtered = value.filter(v => v && v.trim() !== '');
          // Always send top_achievements - backend requires at least 1
          data.append(key, JSON.stringify(filtered.length > 0 ? filtered : []));
        } else if (key === 'is_active') {
          data.append(key, value ? '1' : '0');
        } else if (value !== '' && value !== null && value !== undefined) {
          data.append(key, value);
        }
      });
      
      if (photoFile) data.append('photo', photoFile);

      if (athlete) {
        data.append('_method', 'PUT');
        await api.post(`/api/athletes/${athlete.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/api/athletes', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      onSuccess();
    } catch (error) {
      if (error.response?.status === 422) {
        const errData = error.response.data.errors || {};
        setErrors(errData);
        
        // Build error message from all errors
        const messages = Object.values(errData).flat();
        setErrorMessage(messages.length > 0 ? messages[0] : 'Terjadi kesalahan validasi');
        
        // Determine which step has the first error and go there
        const step1Fields = ['name', 'nik', 'no_kk', 'birth_place', 'birth_date', 'gender', 'religion', 'cabor_id', 'competition_class', 'address'];
        const step2Fields = ['height', 'weight', 'blood_type', 'education_level_id', 'occupation', 'marital_status', 'phone', 'email'];
        
        const errorFields = Object.keys(errData);
        if (errorFields.some(f => step1Fields.includes(f))) {
          setStep(1);
        } else if (errorFields.some(f => step2Fields.includes(f))) {
          setStep(2);
        } else {
          setStep(3);
        }
        
        // Scroll to top to show error
        setTimeout(() => {
          formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
      } else {
        // Backend sends {error: "message"}, not {message: "..."}
        setErrorMessage(error.response?.data?.error || error.response?.data?.message || 'Terjadi kesalahan server');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        key="modal-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              {athlete ? 'Edit Atlet' : 'Tambah Atlet Baru'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Steps */}
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s.id ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  <span className={`ml-2 text-sm ${step >= s.id ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                    {s.title}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${step > s.id ? 'bg-red-600' : 'bg-slate-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div ref={formContainerRef} className="p-6 max-h-[50vh] overflow-y-auto">
            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">{errorMessage}</p>
                  {Object.keys(errors).length > 1 && (
                    <p className="text-xs text-red-600 mt-1">
                      Ada {Object.keys(errors).length} field yang perlu diperbaiki
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Data Pribadi */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Photo */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      photoPreview.startsWith('blob:') ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ProtectedImage src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Upload Foto</span>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => updateField('name', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="Nama lengkap atlet"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">NIK</label>
                    <input
                      type="text"
                      value={formData.nik}
                      onChange={e => updateField('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none font-mono"
                      placeholder="16 digit NIK"
                      maxLength={16}
                    />
                    {errors.nik && <p className="text-red-500 text-xs mt-1">{errors.nik[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">No. KK</label>
                    <input
                      type="text"
                      value={formData.no_kk}
                      onChange={e => updateField('no_kk', e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none font-mono"
                      placeholder="16 digit No KK"
                      maxLength={16}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={formData.birth_place}
                      onChange={e => updateField('birth_place', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="Kota kelahiran"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={e => updateField('birth_date', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={formData.gender}
                      onChange={e => updateField('gender', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                    >
                      <option value="">Pilih</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Agama</label>
                    <select
                      value={formData.religion}
                      onChange={e => updateField('religion', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                    >
                      <option value="">Pilih</option>
                      {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cabang Olahraga</label>
                    <SearchableSelect
                      options={cabors}
                      value={formData.cabor_id}
                      onChange={(val) => handleCaborChange(val)}
                      placeholder="Cari & pilih cabor..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kelas Pertandingan</label>
                    <SearchableSelect
                      options={competitionClasses}
                      value={formData.competition_class_id}
                      onChange={(val) => updateField('competition_class_id', val)}
                      placeholder={formData.cabor_id ? 'Pilih Kelas' : 'Pilih Cabor terlebih dahulu'}
                      disabled={!formData.cabor_id}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Organisasi</label>
                    <SearchableSelect
                      options={organizations}
                      value={formData.organization_id}
                      onChange={(val) => updateField('organization_id', val)}
                      placeholder="Cari & pilih organisasi..."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                    <textarea
                      value={formData.address}
                      onChange={e => updateField('address', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
                      rows={2}
                      placeholder="Alamat lengkap"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Info Fisik & Kontak */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tinggi Badan (cm)</label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={e => updateField('height', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="170"
                      min={50}
                      max={300}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Berat Badan (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={e => updateField('weight', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="65.5"
                      min={20}
                      max={300}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Golongan Darah</label>
                    <select
                      value={formData.blood_type}
                      onChange={e => updateField('blood_type', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                    >
                      <option value="">Pilih</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pendidikan</label>
                    <select
                      value={formData.education_level_id}
                      onChange={e => updateField('education_level_id', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                    >
                      <option value="">Pilih</option>
                      {educationLevels.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pekerjaan</label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={e => updateField('occupation', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="Pekerjaan saat ini"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status Perkawinan</label>
                    <select
                      value={formData.marital_status}
                      onChange={e => updateField('marital_status', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                    >
                      <option value="">Pilih</option>
                      {MARITAL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">No. Telepon</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => updateField('phone', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => updateField('email', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hobi</label>
                    <input
                      type="text"
                      value={formData.hobby}
                      onChange={e => updateField('hobby', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="Hobi atau kegemaran"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Karir & Prestasi */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Mulai Karir</label>
                    <input
                      type="number"
                      value={formData.career_start_year}
                      onChange={e => updateField('career_start_year', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="2015"
                      min={1950}
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={e => updateField('is_active', e.target.checked)}
                        className="w-4 h-4 accent-red-600"
                      />
                      <label htmlFor="is_active" className="text-sm text-slate-700">Atlet Aktif</label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Riwayat Cedera & Penyakit</label>
                  <textarea
                    value={formData.injury_illness_history}
                    onChange={e => updateField('injury_illness_history', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
                    rows={3}
                    placeholder="Riwayat cedera atau penyakit yang pernah dialami..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">3 Prestasi Tertinggi</label>
                  {formData.top_achievements.map((achievement, index) => (
                    <input
                      key={`achievement-${index}`}
                      type="text"
                      value={achievement}
                      onChange={e => updateAchievement(index, e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none mb-2"
                      placeholder={`Prestasi ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPrevStep}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={goToNextStep}
                disabled={!isStepValid()}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {athlete ? 'Update Atlet' : 'Simpan Atlet'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
