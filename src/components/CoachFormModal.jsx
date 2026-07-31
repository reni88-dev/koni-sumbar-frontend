import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  Upload,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink
} from 'lucide-react';
import api from '../api/axios';
import { SearchableSelect } from './SearchableSelect';

const MotionDiv = motion.div;

const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];
const GENDERS = [
  { value: 'male', label: 'Laki-laki' },
  { value: 'female', label: 'Perempuan' }
];
const LICENSE_LEVELS = ['Nasional', 'Daerah', 'Internasional'];
const MAX_CERTIFICATE_SOURCE_SIZE = 10 * 1024 * 1024;
const CERTIFICATE_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp';
const CERTIFICATE_MIME_BY_EXTENSION = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
};

function createEmptyFormData() {
  return {
    name: '',
    nik: '',
    cabor_id: '',
    organization_id: '',
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
  };
}

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

function firstFieldError(fieldError) {
  return Array.isArray(fieldError) ? fieldError[0] : fieldError;
}

function validateImageFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const expectedMime = CERTIFICATE_MIME_BY_EXTENSION[extension];
  if (!expectedMime || extension === 'pdf') {
    throw new Error('Format gambar harus JPG, JPEG, PNG, atau WebP.');
  }
  if (file.type && file.type !== expectedMime) {
    throw new Error('Ekstensi gambar tidak sesuai dengan tipe file.');
  }
}

function validateCertificateSource(file) {
  if (file.size > MAX_CERTIFICATE_SOURCE_SIZE) {
    throw new Error('Ukuran file sumber maksimal 10 MB.');
  }
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const expectedMime = CERTIFICATE_MIME_BY_EXTENSION[extension];
  if (!expectedMime) {
    throw new Error('Format file harus PDF, JPG/JPEG, PNG, atau WebP.');
  }
  if (file.type && file.type !== expectedMime) {
    throw new Error('Ekstensi file tidak sesuai dengan tipe file.');
  }
  return extension;
}

function compressImageToWebP(file, { maxWidth, maxLongest }) {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    const release = () => URL.revokeObjectURL(sourceUrl);

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const widthScale = maxWidth ? Math.min(maxWidth / image.width, 1) : 1;
      const longestScale = maxLongest ? Math.min(maxLongest / Math.max(image.width, image.height), 1) : 1;
      const scale = Math.min(widthScale, longestScale);
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        release();
        reject(new Error('File gambar gagal diproses. Silakan pilih file lain.'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        release();
        if (!blob) {
          reject(new Error('File gambar gagal diproses. Silakan pilih file lain.'));
          return;
        }
        const baseName = file.name.replace(/\.[^/.]+$/, '') || 'image';
        resolve(new File([blob], `${baseName}.webp`, {
          type: 'image/webp',
          lastModified: Date.now()
        }));
      }, 'image/webp', 0.82);
    };
    image.onerror = () => {
      release();
      reject(new Error('Format gambar tidak dapat diproses. Gunakan JPG, JPEG, PNG, atau WebP.'));
    };
    image.src = sourceUrl;
  });
}

function getCoachSaveErrorMessage(err) {
  const serverMessage = err.response?.data?.message || err.response?.data?.error;
  if (serverMessage) return serverMessage;
  if (err.response?.status === 409) return 'Data pelatih sudah terdaftar. Periksa kembali email atau NIK.';
  return 'Gagal menyimpan data pelatih';
}

export function CoachFormModal({ isOpen, onClose, coach, onSuccess }) {
  const [formData, setFormData] = useState(createEmptyFormData);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateProcessing, setCertificateProcessing] = useState(false);
  const [certificateError, setCertificateError] = useState('');
  const [certificateOpening, setCertificateOpening] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [cabors, setCabors] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const photoInputRef = useRef(null);
  const certificateInputRef = useRef(null);
  const photoProcessingIdRef = useRef(0);
  const certificateProcessingIdRef = useRef(0);
  const certificateOpenRequestIdRef = useRef(0);
  const certificateOpenControllerRef = useRef(null);
  const certificatePreviewWindowRef = useRef(null);
  const certificateViewUrlRef = useRef('');
  const submitRequestIdRef = useRef(0);
  const submitControllerRef = useRef(null);
  const submitInFlightRef = useRef(false);

  // Phone validation state
  const [phoneStatus, setPhoneStatus] = useState('idle'); // idle | checking | valid | invalid
  const [phoneMessage, setPhoneMessage] = useState('');
  const phoneCheckRef = useRef(null);

  useEffect(() => () => {
    if (photoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
  }, [photoPreview]);

  useEffect(() => () => {
    if (certificateViewUrlRef.current) {
      URL.revokeObjectURL(certificateViewUrlRef.current);
      certificateViewUrlRef.current = '';
    }
  }, []);

  // Reset all transient file state when the modal closes or switches coach.
  useEffect(() => {
    let active = true;
    photoProcessingIdRef.current += 1;
    certificateProcessingIdRef.current += 1;
    certificateOpenRequestIdRef.current += 1;
    submitRequestIdRef.current += 1;
    phoneCheckRef.current?.abort();
    certificateOpenControllerRef.current?.abort();
    certificateOpenControllerRef.current = null;
    certificatePreviewWindowRef.current?.close();
    certificatePreviewWindowRef.current = null;
    submitControllerRef.current?.abort();
    submitControllerRef.current = null;
    setPhoto(null);
    setPhotoPreview('');
    setPhotoProcessing(false);
    setCertificateFile(null);
    setCertificateProcessing(false);
    setCertificateError('');
    setCertificateOpening(false);
    setFieldErrors({});
    submitInFlightRef.current = false;
    setLoading(false);
    setError('');
    setPhoneStatus('idle');
    setPhoneMessage('');
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (certificateInputRef.current) certificateInputRef.current.value = '';
    if (certificateViewUrlRef.current) {
      URL.revokeObjectURL(certificateViewUrlRef.current);
      certificateViewUrlRef.current = '';
    }

    if (!isOpen) {
      setFormData(createEmptyFormData());
      return () => {
        active = false;
      };
    }

    if (coach) {
      setFormData({
        name: coach.name || '',
        nik: coach.nik || '',
        cabor_id: coach.cabor_id || coach.cabor?.id || '',
        organization_id: coach.organization_id?.toString() || '',
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
      setFormData(createEmptyFormData());
    }

    api.get('/api/cabors/all', { params: { level: 'discipline' } })
      .then((res) => {
        if (!active) return;
        const data = Array.isArray(res.data)
          ? res.data.filter(item => item && item.id).map(item => ({ ...item, name: item.display_name || item.name }))
          : [];
        setCabors(data);
      })
      .catch(() => {
        if (active) setCabors([]);
      });

    api.get('/api/organizations/all')
      .then((res) => {
        if (!active) return;
        const data = Array.isArray(res.data) ? res.data.filter(item => item && item.id) : [];
        setOrganizations(data);
      })
      .catch(() => {
        if (active) setOrganizations([]);
      });

    return () => {
      active = false;
      phoneCheckRef.current?.abort();
      photoProcessingIdRef.current += 1;
      certificateProcessingIdRef.current += 1;
      certificateOpenRequestIdRef.current += 1;
      certificateOpenControllerRef.current?.abort();
      certificatePreviewWindowRef.current?.close();
      submitRequestIdRef.current += 1;
      submitControllerRef.current?.abort();
    };
  }, [isOpen, coach]);

  const handlePhotoChange = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const processingId = ++photoProcessingIdRef.current;
    setPhoto(null);
    setPhotoPreview(coach?.photo ? `/api/coaches/${coach.id}/photo?t=${Date.now()}` : '');
    setPhotoProcessing(true);
    setError('');

    try {
      validateImageFile(file);
      const compressed = await compressImageToWebP(file, { maxWidth: 800 });
      if (processingId !== photoProcessingIdRef.current) return;
      setPhoto(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch (processingError) {
      if (processingId !== photoProcessingIdRef.current) return;
      setError(processingError.message || 'Foto gagal diproses. Silakan pilih file lain.');
    } finally {
      if (processingId === photoProcessingIdRef.current) {
        setPhotoProcessing(false);
      }
    }
  };

  const handleCertificateChange = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const processingId = ++certificateProcessingIdRef.current;
    setCertificateFile(null);
    setCertificateError('');
    setError('');
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next.certificate_document;
      return next;
    });
    setCertificateProcessing(true);

    try {
      const extension = validateCertificateSource(file);
      const processedFile = extension === 'pdf'
        ? file
        : await compressImageToWebP(file, { maxLongest: 1600 });
      if (processingId !== certificateProcessingIdRef.current) return;
      setCertificateFile(processedFile);
    } catch (processingError) {
      if (processingId !== certificateProcessingIdRef.current) return;
      setCertificateError(processingError.message || 'Sertifikat gagal diproses. Silakan pilih file lain.');
    } finally {
      if (processingId === certificateProcessingIdRef.current) {
        setCertificateProcessing(false);
      }
    }
  };

  const handleOpenStoredCertificate = async () => {
    if (!coach?.certificate_document || certificateOpening) return;

    const requestId = ++certificateOpenRequestIdRef.current;
    certificateOpenControllerRef.current?.abort();
    const controller = new AbortController();
    certificateOpenControllerRef.current = controller;

    const previewWindow = window.open('', '_blank');
    certificatePreviewWindowRef.current = previewWindow;
    if (previewWindow) {
      previewWindow.opener = null;
      previewWindow.document.title = 'Memuat sertifikat...';
      previewWindow.document.body.textContent = 'Memuat sertifikat...';
    }
    setCertificateOpening(true);
    setCertificateError('');

    try {
      const response = await api.get(coach.certificate_document, {
        responseType: 'blob',
        signal: controller.signal
      });
      if (requestId !== certificateOpenRequestIdRef.current || controller.signal.aborted) {
        previewWindow?.close();
        return;
      }
      if (certificateViewUrlRef.current) {
        URL.revokeObjectURL(certificateViewUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(response.data);
      certificateViewUrlRef.current = objectUrl;
      if (previewWindow) {
        previewWindow.location.replace(objectUrl);
      } else {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (openError) {
      previewWindow?.close();
      if (requestId !== certificateOpenRequestIdRef.current
        || openError.name === 'CanceledError'
        || openError.code === 'ERR_CANCELED') {
        return;
      }
      setCertificateError(openError.response?.status === 404
        ? 'Sertifikat tersimpan tidak ditemukan.'
        : 'Gagal membuka sertifikat tersimpan.');
    } finally {
      if (requestId === certificateOpenRequestIdRef.current) {
        certificateOpenControllerRef.current = null;
        certificatePreviewWindowRef.current = null;
        setCertificateOpening(false);
      }
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Debounced phone validation via n8n webhook
  useEffect(() => {
    if (!isOpen) return undefined;
    const phone = formData.phone?.trim();

    if (!phone || phone.length < 8) {
      setPhoneStatus('idle');
      setPhoneMessage('');
      return undefined;
    }

    setPhoneStatus('checking');
    setPhoneMessage('Memeriksa nomor...');
    phoneCheckRef.current?.abort();

    const controller = new AbortController();
    phoneCheckRef.current = controller;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/check-phone?phone=${encodeURIComponent(phone)}`, {
          signal: controller.signal
        });
        const data = res.data;
        if (data.numberExists) {
          const normalizedPhone = data.chatId?.replace('@c.us', '') || phone;
          setPhoneStatus('valid');
          setPhoneMessage('WhatsApp aktif');
          if (normalizedPhone !== phone) {
            setFormData(prev => ({ ...prev, phone: normalizedPhone }));
          }
        } else {
          setPhoneStatus('invalid');
          setPhoneMessage('Nomor tidak terdaftar di WhatsApp');
        }
      } catch (phoneError) {
        if (phoneError.name !== 'CanceledError' && phoneError.code !== 'ERR_CANCELED') {
          setPhoneStatus('idle');
          setPhoneMessage('');
        }
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.phone, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitInFlightRef.current || loading || photoProcessing || certificateProcessing) return;

    const canReuseStoredCertificate = Boolean(coach?.certificate_document);
    if (!certificateFile && !canReuseStoredCertificate) {
      const message = certificateError || (coach
        ? 'Data pelatih lama ini belum memiliki sertifikat. Unggah sertifikat sebelum menyimpan perubahan.'
        : 'Sertifikat pelatih wajib diunggah.');
      setCertificateError(message);
      setFieldErrors(prev => ({ ...prev, certificate_document: [message] }));
      setError(message);
      return;
    }

    // Block submit if phone is not WhatsApp-validated
    if (formData.phone?.trim() && phoneStatus !== 'valid') {
      setError('Nomor WhatsApp harus valid sebelum menyimpan data');
      return;
    }

    submitInFlightRef.current = true;
    const requestId = ++submitRequestIdRef.current;
    const controller = new AbortController();
    submitControllerRef.current = controller;
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (key === 'is_active') {
            data.append(key, value ? 'true' : 'false');
          } else {
            data.append(key, value);
          }
        }
      });
      if (photo) data.append('photo', photo);
      if (certificateFile) data.append('certificate_document', certificateFile);

      if (coach) {
        await api.put(`/api/coaches/${coach.id}`, data, { signal: controller.signal });
      } else {
        await api.post('/api/coaches', data, { signal: controller.signal });
      }
      if (requestId === submitRequestIdRef.current && !controller.signal.aborted) {
        onSuccess();
      }
    } catch (saveError) {
      if (requestId !== submitRequestIdRef.current
        || saveError.name === 'CanceledError'
        || saveError.code === 'ERR_CANCELED') {
        return;
      }
      const saveMessage = getCoachSaveErrorMessage(saveError);
      if (saveError.response?.status === 422) {
        const rawErrors = saveError.response.data?.errors || {};
        const normalizedErrors = Object.fromEntries(
          Object.entries(rawErrors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages : [String(messages)]
          ])
        );
        setFieldErrors(normalizedErrors);
        if (normalizedErrors.certificate_document) {
          setCertificateError(firstFieldError(normalizedErrors.certificate_document));
        }
      } else if (/certificate_document|sertifikat/i.test(saveMessage)) {
        setCertificateError(saveMessage);
      } else if (!saveError.response || saveError.response.status >= 500) {
        console.error('Failed to save coach:', saveError);
      }
      setError(saveMessage);
    } finally {
      if (requestId === submitRequestIdRef.current) {
        submitControllerRef.current = null;
        submitInFlightRef.current = false;
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <MotionDiv
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
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
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-64px)] sm:max-h-[calc(90vh-64px)]">
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
                  <label className={`absolute bottom-0 right-0 rounded-full bg-red-600 p-2 text-white shadow-lg transition-colors ${photoProcessing || loading ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-red-700'}`}>
                    {photoProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoChange}
                      disabled={photoProcessing || loading}
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
                <SearchableSelect
                  options={cabors}
                  value={formData.cabor_id}
                  onChange={(val) => updateField('cabor_id', val)}
                  placeholder="Cari & pilih cabor..."
                />
              </div>

              {/* Organisasi */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Organisasi</label>
                <SearchableSelect
                  options={organizations}
                  value={formData.organization_id}
                  onChange={(val) => updateField('organization_id', val)}
                  placeholder="Cari & pilih organisasi..."
                />
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
                <label className="block text-sm font-medium text-slate-700 mb-1">No. WhatsApp</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 outline-none transition-colors ${
                      phoneStatus === 'valid' ? 'border-green-400 focus:ring-green-100 focus:border-green-500' :
                      phoneStatus === 'invalid' ? 'border-red-400 focus:ring-red-100 focus:border-red-500' :
                      'border-slate-200 focus:ring-red-100 focus:border-red-500'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {phoneStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                    {phoneStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {phoneStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
                {phoneMessage && (
                  <p className={`text-xs mt-1 ${
                    phoneStatus === 'valid' ? 'text-green-600' :
                    phoneStatus === 'invalid' ? 'text-red-500' :
                    'text-slate-400'
                  }`}>{phoneMessage}</p>
                )}
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

              {/* Coach Certificate */}
              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Sertifikat Pelatih *</label>
                    <p className="mt-1 text-xs text-slate-500">
                      PDF dikirim tanpa perubahan. Gambar diubah ke WebP kualitas 0.82 dengan sisi terpanjang maksimal 1600 px. File sumber maksimal 10 MB.
                    </p>
                  </div>
                  {coach?.certificate_document && (
                    <button
                      type="button"
                      onClick={handleOpenStoredCertificate}
                      disabled={certificateOpening}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-red-300 hover:text-red-700 disabled:cursor-wait disabled:opacity-60"
                    >
                      {certificateOpening ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                      Buka Sertifikat Tersimpan
                    </button>
                  )}
                </div>

                <label className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 transition-colors ${certificateProcessing || loading ? 'cursor-wait bg-slate-100 text-slate-400' : 'cursor-pointer border-slate-300 bg-white hover:border-red-400 hover:bg-red-50'}`}>
                  {certificateProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {certificateProcessing ? 'Memproses sertifikat...' : (certificateFile ? 'Ganti File Sertifikat' : 'Pilih File Sertifikat')}
                  </span>
                  <input
                    ref={certificateInputRef}
                    type="file"
                    accept={CERTIFICATE_ACCEPT}
                    onChange={handleCertificateChange}
                    disabled={certificateProcessing || loading}
                    className="hidden"
                  />
                </label>

                {certificateFile ? (
                  <p className="mt-2 flex items-center gap-1 text-xs text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> File siap: {certificateFile.name}
                  </p>
                ) : coach?.certificate_document ? (
                  <p className="mt-2 flex items-center gap-1 text-xs text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Sertifikat sudah tersimpan
                  </p>
                ) : coach ? (
                  <p className="mt-2 text-xs text-amber-700">Data lama ini belum memiliki sertifikat dan wajib dilengkapi sebelum disimpan.</p>
                ) : null}

                {(certificateError || fieldErrors.certificate_document) && (
                  <p className="mt-2 text-xs text-red-500">
                    {certificateError || firstFieldError(fieldErrors.certificate_document)}
                  </p>
                )}
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
                disabled={loading || photoProcessing || certificateProcessing || (formData.phone?.trim() && phoneStatus !== 'valid')}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {coach ? 'Simpan Perubahan' : 'Tambah Pelatih'}
              </button>
            </div>
          </form>
        </MotionDiv>
      </div>
    </AnimatePresence>
  );
}
