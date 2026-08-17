import { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  Upload,
  User,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  FileText,
  Phone,
  Award,
  Trophy,
  Camera,
  Briefcase,
  ExternalLink,
  Building2,
  Plus,
  Trash2
} from 'lucide-react';
import api from '../api/axios';
import { DateInput } from './DateInput';
import ProtectedImage from './ProtectedImage';
import { SearchableSelect } from './SearchableSelect';

const STEPS = [
  { id: 1, title: 'Data Pribadi', subtitle: 'Biodata & Afiliasi', icon: User },
  { id: 2, title: 'Kontak & Akun', subtitle: 'No. WhatsApp & Email', icon: Phone },
  { id: 3, title: 'Lisensi & Karir', subtitle: 'Sertifikat & Prestasi', icon: Award }
];

const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];
const GENDERS = [
  { value: 'male', label: 'Laki-laki' },
  { value: 'female', label: 'Perempuan' }
];
const LICENSE_LEVELS = ['Nasional', 'Daerah', 'Internasional'];

const IDENTITY_PATTERN = /^[0-9]{16}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_INPUT_PATTERN = /^\+?[0-9\s().-]+$/;
const PHONE_PATTERN = /^628[0-9]{8,11}$/;
const PHONE_CHECK_TIMEOUT_MS = 5000;
const PHONE_CHECK_SKIPPED_MESSAGE = 'Format nomor valid; pengecekan WhatsApp dilewati';
const MAX_SOURCE_FILE_SIZE = 10 * 1024 * 1024;
const CERTIFICATE_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp';
const DOCUMENT_MIME_BY_EXTENSION = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
};

const firstFieldError = (fieldError) => (
  Array.isArray(fieldError) ? fieldError[0] : fieldError
);

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  const match = String(dateString).match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const parseAchievementsForForm = (achievements) => {
  if (!achievements) return ['', '', ''];
  let list = [];
  if (Array.isArray(achievements)) {
    list = achievements.map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return item.title || item.name || item.achievement || item.description || JSON.stringify(item);
      }
      return String(item);
    }).filter(Boolean);
  } else if (typeof achievements === 'string') {
    const trimmed = achievements.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseAchievementsForForm(parsed);
      } catch {
        list = trimmed.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      }
    } else {
      list = trimmed.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    }
  }

  if (list.length === 0) return ['', '', ''];
  while (list.length < 3) {
    list.push('');
  }
  return list;
};

const validateSourceFile = (file, { allowPDF }) => {
  if (file.size > MAX_SOURCE_FILE_SIZE) {
    throw new Error('Ukuran file sumber maksimal 10 MB.');
  }
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const expectedMime = DOCUMENT_MIME_BY_EXTENSION[extension];
  if (!expectedMime || (!allowPDF && extension === 'pdf')) {
    throw new Error(allowPDF
      ? 'Format file harus PDF, JPG, PNG, atau WebP.'
      : 'Format file harus JPG, PNG, atau WebP.');
  }
  if (file.type && file.type !== expectedMime) {
    throw new Error('Ekstensi file tidak sesuai dengan tipe file.');
  }
  return { extension, expectedMime };
};

const compressImageToWebP = (file, { maxWidth, maxLongest }) => new Promise((resolve, reject) => {
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
      const baseName = file.name.replace(/\.[^/.]+$/, '') || 'document';
      resolve(new File([blob], `${baseName}.webp`, {
        type: 'image/webp',
        lastModified: Date.now()
      }));
    }, 'image/webp', 0.82);
  };
  image.onerror = () => {
    release();
    reject(new Error('Format gambar tidak dapat diproses. Gunakan JPG, PNG, atau WebP.'));
  };
  image.src = sourceUrl;
});

const normalizeIndonesianMobile = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (!PHONE_INPUT_PATTERN.test(raw)) return null;

  let phone = raw.replace(/\D/g, '');
  if (phone.startsWith('62')) {
    // Already normalized.
  } else if (phone.startsWith('0')) {
    phone = `62${phone.slice(1)}`;
  } else if (phone.startsWith('8')) {
    phone = `62${phone}`;
  } else {
    return null;
  }

  return PHONE_PATTERN.test(phone) ? phone : null;
};

const isCanceledRequest = (error) => (
  error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED'
);

const checkWhatsAppPhone = async (phone, signal) => {
  try {
    const response = await api.get('/api/check-phone', {
      params: { phone },
      signal,
      timeout: PHONE_CHECK_TIMEOUT_MS
    });
    const data = response.data;

    if (data?.validationSkipped === true || data?.error) {
      return { status: 'valid', message: PHONE_CHECK_SKIPPED_MESSAGE };
    }
    if (data?.numberExists === true) {
      return { status: 'valid', message: 'WhatsApp aktif' };
    }
    if (data?.numberExists === false) {
      return { status: 'invalid', message: 'Nomor tidak terdaftar di WhatsApp' };
    }
    return { status: 'valid', message: PHONE_CHECK_SKIPPED_MESSAGE };
  } catch (error) {
    if (isCanceledRequest(error)) throw error;
    return { status: 'valid', message: PHONE_CHECK_SKIPPED_MESSAGE };
  }
};

function FormSectionCard({ icon: Icon, iconColor = 'text-blue-600', iconBg = 'bg-blue-50', title, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm ${className}`}>
      {(title || Icon) && (
        <div className="mb-4 flex items-center gap-3 pb-3 border-b border-slate-100">
          {Icon && (
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
              <Icon className="w-4 h-4" />
            </span>
          )}
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-tight">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {children}
      </div>
    </div>
  );
}

function createInitialFormData() {
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
    is_active: true
  };
}

export function CoachFormModal({ isOpen, onClose, coach, onSuccess }) {
  const formContainerRef = useRef(null);
  const photoProcessingIdRef = useRef(0);
  const certificateProcessingIdRef = useRef(0);
  const certificateOpenRequestIdRef = useRef(0);
  const certificateOpenControllerRef = useRef(null);
  const certificatePreviewWindowRef = useRef(null);
  const certificateViewUrlRef = useRef('');
  const submitRequestIdRef = useRef(0);
  const submitControllerRef = useRef(null);
  const submitInFlightRef = useRef(false);

  const [step, setStep] = useState(1);
  const [cabors, setCabors] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState(createInitialFormData);
  const [achievementsList, setAchievementsList] = useState(['', '', '']);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateProcessing, setCertificateProcessing] = useState(false);
  const [certificateError, setCertificateError] = useState('');
  const [certificateOpening, setCertificateOpening] = useState(false);

  // Phone validation state
  const [phoneStatus, setPhoneStatus] = useState('idle');
  const [phoneMessage, setPhoneMessage] = useState('');
  const phoneCheckRef = useRef(null);
  const initialPhoneValueRef = useRef('');

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

  useEffect(() => {
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

    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoProcessing(false);
    setCertificateFile(null);
    setCertificateProcessing(false);
    setCertificateError('');
    setCertificateOpening(false);
    setLoading(false);
    setErrors({});
    setErrorMessage('');
    submitInFlightRef.current = false;

    if (!isOpen) {
      setFormData(createInitialFormData());
      setAchievementsList(['', '', '']);
      setPhoneStatus('idle');
      setPhoneMessage('');
      initialPhoneValueRef.current = '';
      return;
    }

    setStep(1);
    fetchCabors();
    fetchOrganizations();

    if (coach) {
      const savedPhone = normalizeIndonesianMobile(coach.phone) ?? coach.phone ?? '';
      const savedBirthDate = formatDateForInput(coach.birth_date);
      initialPhoneValueRef.current = savedPhone;

      setFormData({
        name: coach.name || '',
        nik: coach.nik || '',
        cabor_id: coach.cabor_id?.toString() || coach.cabor?.id?.toString() || '',
        organization_id: coach.organization_id?.toString() || '',
        birth_place: coach.birth_place || '',
        birth_date: savedBirthDate,
        gender: coach.gender || '',
        religion: coach.religion || '',
        address: coach.address || '',
        phone: savedPhone,
        email: coach.email || '',
        license_number: coach.license_number || '',
        license_level: coach.license_level || '',
        coaching_start_year: coach.coaching_start_year?.toString() || '',
        specialization: coach.specialization || '',
        is_active: coach.is_active ?? true
      });

      setAchievementsList(parseAchievementsForForm(coach.achievements));
      setPhotoPreview(coach.photo || null);
      setPhoneStatus(savedPhone ? (normalizeIndonesianMobile(savedPhone) ? 'valid' : 'invalid') : 'idle');
      setPhoneMessage(savedPhone ? (normalizeIndonesianMobile(savedPhone) ? 'Nomor tersimpan' : 'Format nomor WhatsApp tidak valid') : '');
    } else {
      setFormData(createInitialFormData());
      setAchievementsList(['', '', '']);
      setPhoneStatus('idle');
      setPhoneMessage('');
      initialPhoneValueRef.current = '';
    }

    return () => {
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

  const fetchCabors = async () => {
    try {
      const res = await api.get('/api/cabors/all', { params: { level: 'discipline' } });
      const data = Array.isArray(res.data)
        ? res.data.filter((item) => item && item.id).map((item) => ({ ...item, name: item.display_name || item.name }))
        : [];
      setCabors(data);
    } catch (e) {
      console.error('Failed to fetch cabors:', e);
      setCabors([]);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const res = await api.get('/api/organizations/all');
      const data = Array.isArray(res.data) ? res.data.filter((item) => item && item.id) : [];
      setOrganizations(data);
    } catch (e) {
      console.error('Failed to fetch organizations:', e);
      setOrganizations([]);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleAchievementChange = (index, value) => {
    setAchievementsList((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddAchievement = () => {
    setAchievementsList((prev) => [...prev, '']);
  };

  const handleRemoveAchievement = (index) => {
    setAchievementsList((prev) => {
      if (prev.length <= 1) return [''];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handlePhotoChange = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const processingId = ++photoProcessingIdRef.current;
    setPhotoFile(null);
    setPhotoPreview(coach?.photo || null);
    setPhotoProcessing(true);
    setErrorMessage('');

    try {
      validateSourceFile(file, { allowPDF: false });
      const compressed = await compressImageToWebP(file, { maxWidth: 800 });
      if (processingId !== photoProcessingIdRef.current) return;
      setPhotoFile(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch (error) {
      if (processingId !== photoProcessingIdRef.current) return;
      setPhotoFile(null);
      setErrorMessage(error.message || 'Foto gagal diproses. Silakan pilih file lain.');
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
    setErrors((prev) => {
      const next = { ...prev };
      delete next.certificate_document;
      return next;
    });
    setCertificateProcessing(true);

    try {
      const { extension } = validateSourceFile(file, { allowPDF: true });
      const processedFile = extension === 'pdf'
        ? file
        : await compressImageToWebP(file, { maxLongest: 1600 });
      if (processingId !== certificateProcessingIdRef.current) return;
      setCertificateFile(processedFile);
    } catch (error) {
      if (processingId !== certificateProcessingIdRef.current) return;
      setCertificateError(error.message || 'Sertifikat gagal diproses. Silakan pilih file lain.');
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
      if (
        requestId !== certificateOpenRequestIdRef.current ||
        openError.name === 'CanceledError' ||
        openError.code === 'ERR_CANCELED'
      ) {
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

  // Debounced phone validation via n8n webhook with fail-open fallback
  useEffect(() => {
    if (!isOpen) {
      setPhoneStatus('idle');
      setPhoneMessage('');
      return;
    }

    const phone = formData.phone?.trim();
    if (!phone) {
      setPhoneStatus('idle');
      setPhoneMessage('');
      return;
    }
    const normalized = normalizeIndonesianMobile(phone);
    if (!normalized) {
      setPhoneStatus('invalid');
      setPhoneMessage('Format nomor WhatsApp tidak valid');
      return;
    }
    if (normalized !== phone) {
      setPhoneStatus('checking');
      setPhoneMessage('Memeriksa nomor...');
      setFormData((prev) => ({ ...prev, phone: normalized }));
      return;
    }
    if (coach?.id && normalized === initialPhoneValueRef.current) {
      setPhoneStatus('valid');
      setPhoneMessage('Nomor tersimpan');
      return;
    }

    setPhoneStatus('checking');
    setPhoneMessage('Memeriksa nomor...');
    phoneCheckRef.current?.abort();
    const controller = new AbortController();
    phoneCheckRef.current = controller;
    const timer = setTimeout(async () => {
      try {
        const result = await checkWhatsAppPhone(normalized, controller.signal);
        if (controller.signal.aborted) return;
        setPhoneStatus(result.status);
        setPhoneMessage(result.message);
      } catch (error) {
        if (!isCanceledRequest(error)) {
          setPhoneStatus('valid');
          setPhoneMessage(PHONE_CHECK_SKIPPED_MESSAGE);
        }
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.phone, coach?.id, isOpen]);

  const canReuseStoredCertificate = Boolean(coach?.certificate_document);
  const isAnyFileProcessing = photoProcessing || certificateProcessing;

  const isStepValid = () => {
    if (step === 1) {
      const isNikValid = !formData.nik || IDENTITY_PATTERN.test(formData.nik);
      return (
        formData.name.trim() !== '' &&
        formData.cabor_id !== '' &&
        isNikValid &&
        !photoProcessing
      );
    }
    if (step === 2) {
      const isPhoneValid = !formData.phone?.trim() || phoneStatus === 'valid';
      const isEmailValid = !formData.email?.trim() || EMAIL_PATTERN.test(formData.email.trim());
      return isPhoneValid && isEmailValid;
    }
    if (step === 3) {
      const hasCertificate = Boolean(certificateFile || canReuseStoredCertificate);
      return hasCertificate && !certificateProcessing && !certificateError;
    }
    return true;
  };

  const goToNextStep = () => {
    if (isStepValid() && step < 3) {
      setStep(step + 1);
      setTimeout(() => {
        formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  const goToPrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setTimeout(() => {
        formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  const handleSubmit = async () => {
    if (submitInFlightRef.current || loading || isAnyFileProcessing) return;

    // Step 1 Validation
    const step1Errors = {};
    if (!formData.name.trim()) {
      step1Errors.name = ['Nama lengkap wajib diisi'];
    }
    if (!formData.cabor_id) {
      step1Errors.cabor_id = ['Cabang olahraga wajib dipilih'];
    }
    if (formData.nik && !IDENTITY_PATTERN.test(formData.nik)) {
      step1Errors.nik = ['NIK harus tepat 16 digit angka'];
    }
    if (Object.keys(step1Errors).length > 0) {
      setErrors(step1Errors);
      setErrorMessage(firstFieldError(Object.values(step1Errors)[0]));
      setStep(1);
      setTimeout(() => formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
      return;
    }

    // Step 2 Validation
    const normalizedPhone = formData.phone ? normalizeIndonesianMobile(formData.phone) : '';
    const step2Errors = {};
    if (formData.phone?.trim()) {
      if (!normalizedPhone) {
        step2Errors.phone = ['Format nomor WhatsApp tidak valid'];
      } else if (phoneStatus !== 'valid') {
        step2Errors.phone = [phoneMessage || 'Nomor WhatsApp harus valid sebelum menyimpan data'];
      }
    }
    if (formData.email?.trim() && !EMAIL_PATTERN.test(formData.email.trim())) {
      step2Errors.email = ['Format alamat email tidak valid'];
    }
    if (Object.keys(step2Errors).length > 0) {
      setErrors(step2Errors);
      setErrorMessage(firstFieldError(Object.values(step2Errors)[0]));
      setStep(2);
      setTimeout(() => formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
      return;
    }

    // Step 3 Validation
    if (!certificateFile && !canReuseStoredCertificate) {
      const msg = certificateError || (coach
        ? 'Data pelatih lama ini belum memiliki sertifikat. Unggah sertifikat sebelum menyimpan perubahan.'
        : 'Sertifikat pelatih wajib diunggah.');
      setCertificateError(msg);
      setErrors({ certificate_document: [msg] });
      setErrorMessage(msg);
      setStep(3);
      setTimeout(() => formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
      return;
    }

    submitInFlightRef.current = true;
    const requestId = ++submitRequestIdRef.current;
    const controller = new AbortController();
    submitControllerRef.current = controller;
    setLoading(true);
    setErrors({});
    setErrorMessage('');

    try {
      const data = new FormData();
      const submissionData = {
        ...formData,
        phone: normalizedPhone || ''
      };

      Object.entries(submissionData).forEach(([key, value]) => {
        if (key === 'is_active') {
          data.append(key, value ? 'true' : 'false');
        } else if (value !== '' && value !== null && value !== undefined) {
          data.append(key, value);
        }
      });

      const filteredAchievements = achievementsList.filter((v) => v && v.trim() !== '');
      if (filteredAchievements.length > 0) {
        data.append('achievements', JSON.stringify(filteredAchievements));
      } else {
        data.append('achievements', '');
      }

      if (photoFile) data.append('photo', photoFile);
      if (certificateFile) data.append('certificate_document', certificateFile);

      if (coach) {
        await api.put(`/api/coaches/${coach.id}`, data, { signal: controller.signal });
      } else {
        await api.post('/api/coaches', data, { signal: controller.signal });
      }

      if (requestId === submitRequestIdRef.current && !controller.signal.aborted) {
        onSuccess();
      }
    } catch (error) {
      if (
        requestId !== submitRequestIdRef.current ||
        error.name === 'CanceledError' ||
        error.code === 'ERR_CANCELED'
      ) {
        return;
      }

      if (error.response?.status === 422) {
        const rawErrors = error.response.data.errors || {};
        const errData = Object.fromEntries(
          Object.entries(rawErrors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages : [String(messages)]
          ])
        );
        setErrors(errData);
        if (errData.phone) {
          setPhoneStatus('invalid');
          setPhoneMessage(firstFieldError(errData.phone));
        }
        if (errData.certificate_document) {
          setCertificateError(firstFieldError(errData.certificate_document));
        }

        const messages = Object.values(errData).flat();
        setErrorMessage(messages.length > 0 ? messages[0] : 'Terjadi kesalahan validasi data');

        const step1Fields = ['name', 'nik', 'cabor_id', 'organization_id', 'birth_place', 'birth_date', 'gender', 'religion', 'address', 'photo'];
        const step2Fields = ['phone', 'email'];
        const errorFields = Object.keys(errData);

        if (errorFields.some((f) => step1Fields.includes(f))) {
          setStep(1);
        } else if (errorFields.some((f) => step2Fields.includes(f))) {
          setStep(2);
        } else {
          setStep(3);
        }

        setTimeout(() => {
          formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
      } else if (error.response?.status === 409) {
        setErrorMessage('Data pelatih sudah terdaftar. Periksa kembali email atau NIK.');
      } else {
        setErrorMessage(error.response?.data?.error || error.response?.data?.message || 'Terjadi kesalahan server');
      }
    } finally {
      if (requestId === submitRequestIdRef.current) {
        submitControllerRef.current = null;
        submitInFlightRef.current = false;
        setLoading(false);
      }
    }
  };

  const nikInvalid = Boolean(errors.nik) || (formData.nik !== '' && !IDENTITY_PATTERN.test(formData.nik));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <Motion.div
        key="coach-form-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <Motion.div
        key="coach-form-modal"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 pt-6 sm:p-6 sm:pt-10"
      >
        <div
          className="my-auto flex max-h-[calc(100vh-3.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl ring-1 ring-slate-900/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Executive Hero Header */}
          <div className="relative bg-gradient-to-br from-slate-950 via-red-950 to-red-700 text-white p-5 sm:p-6 overflow-hidden shrink-0">
            {/* Ambient Lighting */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -left-12 -top-12 h-56 w-56 rounded-full bg-red-500/20 blur-3xl" />
              <div className="absolute right-0 bottom-0 h-48 w-48 rounded-full bg-amber-400/15 blur-3xl" />
            </div>

            <div className="relative flex items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-red-200 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-300" />
                  <span>KONI SUMATERA BARAT &bull; FORM DATA PELATIH</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                  {coach ? `Edit Data: ${coach.name}` : 'Registrasi Pelatih Baru'}
                </h2>
                <p className="text-xs text-red-100/80 mt-0.5">
                  Lengkapi data profil pelatih secara teliti pada 3 tahapan formulir berikut.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all cursor-pointer"
                title="Tutup (Esc)"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stepper Progress Navigation */}
          <div className="bg-slate-50 border-b border-slate-200/80 p-3 sm:p-4 shrink-0">
            {/* Desktop / Tablet Stepper (Horizontal Cards) */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-2.5">
              {STEPS.map((s) => {
                const StepIcon = s.icon;
                const isCurrent = step === s.id;
                const isPassed = step > s.id;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      if (s.id < step) setStep(s.id);
                    }}
                    disabled={s.id > step}
                    className={`group flex items-center gap-2.5 rounded-2xl p-2.5 text-left transition-all ${
                      isCurrent
                        ? 'bg-white shadow-sm ring-1 ring-red-500/30 border-l-4 border-l-red-600'
                        : isPassed
                          ? 'bg-white/60 hover:bg-white text-slate-700 cursor-pointer border border-slate-200/60'
                          : 'bg-slate-100/60 opacity-60 cursor-not-allowed border border-transparent'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs transition-colors ${
                        isCurrent
                          ? 'bg-red-600 text-white shadow-xs'
                          : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold leading-none truncate ${isCurrent ? 'text-red-700' : 'text-slate-800'}`}>
                        {s.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{s.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mobile Stepper (Compact Indicator with Progress Bar) */}
            <div className="sm:hidden space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">
                    {step}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">{STEPS[step - 1].title}</p>
                    <p className="text-[10px] text-slate-400">{STEPS[step - 1].subtitle}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  Langkah {step} dari 3
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Form Scrollable Body */}
          <div ref={formContainerRef} className="flex-1 overflow-y-auto bg-slate-50/70 p-4 sm:p-6 space-y-4">
            {/* Global Error Banner */}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 shadow-xs">
                <div className="p-2 rounded-xl bg-red-100 text-red-600 shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-red-800">Harap periksa isian formulir:</p>
                  <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
                  {Object.keys(errors).length > 1 && (
                    <p className="text-[11px] text-red-600/90 mt-1">
                      Terdapat <strong>{Object.keys(errors).length}</strong> kolom yang memerlukan perbaikan.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 1: DATA PRIBADI & AFILIASI */}
            {step === 1 && (
              <div className="space-y-4">
                {/* 1. Pas Foto Pelatih */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                  <div className="relative shrink-0">
                    <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-2 border-slate-200 bg-slate-100 p-1 shadow-inner overflow-hidden flex items-center justify-center">
                      {photoPreview ? (
                        photoPreview.startsWith('blob:') ? (
                          <img src={photoPreview} alt="Preview" className="h-full w-full rounded-xl object-cover" />
                        ) : (
                          <ProtectedImage src={photoPreview} alt="Preview" className="h-full w-full rounded-xl object-cover" />
                        )
                      ) : (
                        <User className="h-12 w-12 text-slate-300" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Pas Foto Pelatih</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Unggah pas foto formal berlatar polos. Format JPG, PNG, atau WebP (maks. 10 MB).
                      </p>
                    </div>
                    <div>
                      <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        photoProcessing
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs hover:border-slate-300 cursor-pointer'
                      }`}>
                        {photoProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-slate-600" />}
                        <span>{photoProcessing ? 'Memproses Foto...' : photoPreview ? 'Ganti Foto' : 'Pilih Foto Pelatih'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handlePhotoChange}
                          disabled={photoProcessing}
                          className="hidden"
                        />
                      </label>
                      {photoFile && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 ml-2">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Foto siap diunggah
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Identitas Utama & Kependudukan */}
                <FormSectionCard
                  icon={User}
                  iconColor="text-blue-600"
                  iconBg="bg-blue-50"
                  title="Identitas Utama & Kependudukan"
                  subtitle="Nama lengkap dan nomor identitas kependudukan resmi"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 outline-none text-sm transition-colors ${
                        errors.name ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500' : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
                      }`}
                      placeholder="Masukkan nama lengkap sesuai KTP"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.name)}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      NIK (Nomor Induk Kependudukan)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.nik}
                      onChange={(e) => updateField('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 outline-none font-mono text-sm transition-colors ${
                        nikInvalid
                          ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500'
                          : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
                      }`}
                      placeholder="16 digit angka NIK (Opsional)"
                      maxLength={16}
                    />
                    <div className="mt-1 flex items-start justify-between gap-2 text-xs">
                      <p className={nikInvalid ? 'text-red-500' : 'text-slate-400'}>
                        {firstFieldError(errors.nik) || (nikInvalid ? 'NIK harus tepat 16 digit angka jika diisi' : 'Opsional, 16 digit angka')}
                      </p>
                      {formData.nik && (
                        <span className={`font-mono ${formData.nik.length === 16 ? 'text-emerald-600 font-bold' : nikInvalid ? 'text-red-500' : 'text-slate-400'}`}>
                          {formData.nik.length}/16
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      value={formData.birth_place}
                      onChange={(e) => updateField('birth_place', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                      placeholder="Kota / Kabupaten lahir"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tanggal Lahir
                    </label>
                    <DateInput
                      value={formData.birth_date}
                      onChange={(e) => updateField('birth_date', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => updateField('gender', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white"
                    >
                      <option value="">Pilih Jenis Kelamin</option>
                      {GENDERS.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Agama
                    </label>
                    <select
                      value={formData.religion}
                      onChange={(e) => updateField('religion', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white"
                    >
                      <option value="">Pilih Agama</option>
                      {RELIGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </FormSectionCard>

                {/* 3. Afiliasi Olahraga & Domisili */}
                <FormSectionCard
                  icon={Building2}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                  title="Afiliasi Olahraga & Domisili"
                  subtitle="Cabang olahraga, induk organisasi / pengcab dan alamat domisili"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Cabang Olahraga <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={cabors}
                      value={formData.cabor_id}
                      onChange={(val) => updateField('cabor_id', val)}
                      placeholder="Cari & pilih cabang olahraga..."
                    />
                    {errors.cabor_id && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.cabor_id)}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Organisasi / Pengcab
                    </label>
                    <SearchableSelect
                      options={organizations}
                      value={formData.organization_id}
                      onChange={(val) => updateField('organization_id', val)}
                      placeholder="Cari & pilih organisasi / pengcab..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Alamat Domisili
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      rows={2}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm resize-none"
                      placeholder="Alamat lengkap tempat tinggal saat ini"
                    />
                  </div>
                </FormSectionCard>
              </div>
            )}

            {/* STEP 2: KONTAK & KOMUNIKASI */}
            {step === 2 && (
              <div className="space-y-4">
                <FormSectionCard
                  icon={Phone}
                  iconColor="text-purple-600"
                  iconBg="bg-purple-50"
                  title="Kontak & Komunikasi"
                  subtitle="Nomor WhatsApp aktif dan akun surel resmi pelatih"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nomor WhatsApp
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl focus:ring-2 outline-none font-mono text-sm transition-colors ${
                          phoneStatus === 'valid' ? 'border-emerald-400 bg-emerald-50/40 focus:ring-emerald-100 focus:border-emerald-500' :
                          phoneStatus === 'invalid' ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500' :
                          'border-slate-200 focus:ring-red-100 focus:border-red-500'
                        }`}
                        placeholder="Contoh: 081234567890"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {phoneStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                        {phoneStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {phoneStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                    {phoneMessage ? (
                      <p className={`text-xs mt-1 font-medium ${
                        phoneStatus === 'valid' ? 'text-emerald-700' :
                        phoneStatus === 'invalid' ? 'text-red-500' :
                        'text-slate-400'
                      }`}>
                        {phoneMessage}
                      </p>
                    ) : (
                      <p className="text-slate-400 text-xs mt-1">Nomor WhatsApp aktif untuk koordinasi dan notifikasi.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 outline-none text-sm transition-colors ${
                        errors.email ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500' : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
                      }`}
                      placeholder="contoh@email.com"
                    />
                    {errors.email ? (
                      <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.email)}</p>
                    ) : (
                      <p className="text-slate-400 text-xs mt-1">Digunakan untuk akses akun portal dan laporan.</p>
                    )}
                  </div>
                </FormSectionCard>
              </div>
            )}

            {/* STEP 3: LISENSI, SERTIFIKAT & PRESTASI */}
            {step === 3 && (
              <div className="space-y-4">
                {/* 1. Lisensi & Spesialisasi */}
                <FormSectionCard
                  icon={Award}
                  iconColor="text-amber-600"
                  iconBg="bg-amber-50"
                  title="Lisensi & Spesialisasi"
                  subtitle="Data sertifikasi lisensi dan bidang keahlian kepelatihan"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nomor Lisensi
                    </label>
                    <input
                      type="text"
                      value={formData.license_number}
                      onChange={(e) => updateField('license_number', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none font-mono text-sm"
                      placeholder="Nomor lisensi kepelatihan"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Level Lisensi
                    </label>
                    <select
                      value={formData.license_level}
                      onChange={(e) => updateField('license_level', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white"
                    >
                      <option value="">Pilih Level Lisensi</option>
                      {LICENSE_LEVELS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Spesialisasi
                    </label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => updateField('specialization', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                      placeholder="Contoh: Teknik, Fisik, Taktik, Mental"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tahun Mulai Melatih
                    </label>
                    <input
                      type="number"
                      value={formData.coaching_start_year}
                      onChange={(e) => updateField('coaching_start_year', e.target.value)}
                      min={1950}
                      max={new Date().getFullYear()}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                      placeholder="Contoh: 2018"
                    />
                  </div>
                </FormSectionCard>

                {/* 2. Dokumen Bukti Sertifikat */}
                <FormSectionCard
                  icon={FileText}
                  iconColor="text-blue-600"
                  iconBg="bg-blue-50"
                  title="Dokumen Sertifikat Kepelatihan"
                  subtitle="Unggah bukti fisik sertifikat / lisensi resmi pelatih (Wajib)"
                >
                  <div className="sm:col-span-2 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <p className="font-semibold text-slate-800">Ketentuan File Sertifikat:</p>
                        <p className="text-[11px] text-slate-500">
                          Format PDF, JPG, PNG, atau WebP. Gambar otomatis dioptimasi WebP. Maksimal ukuran file 10 MB.
                        </p>
                      </div>
                      {coach?.certificate_document && (
                        <button
                          type="button"
                          onClick={handleOpenStoredCertificate}
                          disabled={certificateOpening}
                          className="inline-flex shrink-0 items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {certificateOpening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                          <span>Buka Sertifikat Tersimpan</span>
                        </button>
                      )}
                    </div>

                    <label className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed transition-all ${
                      certificateProcessing || loading
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-wait'
                        : errors.certificate_document || certificateError
                          ? 'bg-red-50/50 border-red-300 hover:bg-red-50 hover:border-red-400 text-red-700 cursor-pointer'
                          : certificateFile || coach?.certificate_document
                            ? 'bg-emerald-50/40 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 text-emerald-800 cursor-pointer'
                            : 'bg-slate-50/60 border-slate-300 hover:bg-white hover:border-red-400 hover:shadow-xs text-slate-600 cursor-pointer'
                    }`}>
                      <div className={`p-3 rounded-2xl ${
                        certificateFile || coach?.certificate_document
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-white shadow-2xs text-slate-600'
                      }`}>
                        {certificateProcessing ? (
                          <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                        ) : certificateFile || coach?.certificate_document ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <Upload className="w-6 h-6 text-slate-500" />
                        )}
                      </div>

                      <div className="text-center space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">
                          {certificateProcessing
                            ? 'Memproses file dokumen sertifikat...'
                            : certificateFile
                              ? `File siap: ${certificateFile.name}`
                              : coach?.certificate_document
                                ? 'Sertifikat sudah tersimpan (Klik untuk ganti file)'
                                : 'Klik untuk pilih dokumen sertifikat'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          PDF, JPG, PNG, atau WebP hingga 10 MB
                        </p>
                      </div>

                      <input
                        type="file"
                        accept={CERTIFICATE_ACCEPT}
                        onChange={handleCertificateChange}
                        disabled={certificateProcessing || loading}
                        className="hidden"
                      />
                    </label>

                    {(certificateError || errors.certificate_document) && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{certificateError || firstFieldError(errors.certificate_document)}</span>
                      </p>
                    )}
                  </div>
                </FormSectionCard>

                {/* 3. Prestasi Kepelatihan */}
                <FormSectionCard
                  icon={Trophy}
                  iconColor="text-amber-600"
                  iconBg="bg-amber-50"
                  title="Prestasi Kepelatihan"
                  subtitle="Daftar prestasi terbaik yang pernah diraih atlet asuhan / kepelatihan"
                >
                  <div className="sm:col-span-2 space-y-2.5">
                    {achievementsList.map((ach, idx) => (
                      <div key={`coach-ach-${idx}`} className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold font-mono">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={ach}
                          onChange={(e) => handleAchievementChange(idx, e.target.value)}
                          className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-xs sm:text-sm"
                          placeholder={
                            idx === 0 ? 'Contoh: Medali Emas PON XXI Aceh-Sumut 2024' :
                            idx === 1 ? 'Contoh: Juara 1 Kejurnas 2023' :
                            `Prestasi kepelatihan #${idx + 1} (Opsional)`
                          }
                        />
                        {achievementsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAchievement(idx)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="Hapus baris prestasi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleAddAchievement}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 text-amber-800 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Prestasi Lainnya</span>
                      </button>
                    </div>
                  </div>
                </FormSectionCard>

                {/* 4. Status Keaktifan */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      formData.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Status Keaktifan Pelatih</h4>
                      <p className="text-xs text-slate-500">
                        {formData.is_active ? 'Pelatih berstatus aktif dan terdaftar dalam pembinaan olahraga' : 'Pelatih berstatus nonaktif'}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => updateField('is_active', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer / Navigation Controls */}
          <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-white flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={goToPrevStep}
              disabled={step === 1}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={goToNextStep}
                disabled={!isStepValid()}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Langkah Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || isAnyFileProcessing || !isStepValid()}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Data...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{coach ? 'Simpan Perubahan' : 'Simpan Data Pelatih'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </Motion.div>
    </AnimatePresence>
  );
}

export default CoachFormModal;
