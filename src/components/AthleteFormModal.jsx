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
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import api from '../api/axios';
import { DateInput } from './DateInput';
import ProtectedImage from './ProtectedImage';
import { SearchableSelect } from './SearchableSelect';

const STEPS = [
  { id: 1, title: 'Data Pribadi' },
  { id: 2, title: 'Info Fisik & Kontak' },
  { id: 3, title: 'Karir & Prestasi' },
  { id: 4, title: 'Data Orang Tua' }
];

const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const MARITAL_STATUSES = [
  { value: 'single', label: 'Belum Menikah' },
  { value: 'married', label: 'Menikah' },
  { value: 'divorced', label: 'Cerai' },
  { value: 'widowed', label: 'Duda/Janda' }
];
const IDENTITY_PATTERN = /^[0-9]{16}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_INPUT_PATTERN = /^\+?[0-9\s().-]+$/;
const PHONE_PATTERN = /^628[0-9]{8,11}$/;
const PHONE_CHECK_TIMEOUT_MS = 5000;
const PHONE_CHECK_SKIPPED_MESSAGE = 'Format nomor valid; pengecekan WhatsApp dilewati';
const MotionDiv = motion.div;

const firstFieldError = (fieldError) => (
  Array.isArray(fieldError) ? fieldError[0] : fieldError
);

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
  const photoProcessingIdRef = useRef(0);
  const [step, setStep] = useState(1);
  const [cabors, setCabors] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [competitionClasses, setCompetitionClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    cabor_id: '', organization_id: '', education_level_id: '', competition_class_id: '', name: '', nik: '', national_athlete_number: '', no_kk: '',
    birth_place: '', birth_date: '', gender: '',
    religion: '', address: '', blood_type: '', occupation: '',
    marital_status: '', hobby: '', height: '', weight: '', phone: '', email: '',
    career_start_year: '', injury_illness_history: '',
    top_achievements: ['', '', ''],
    father_name: '', mother_name: '', parent_address: '', father_phone: '', mother_phone: '',
    is_active: true
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => () => {
    if (photoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
  }, [photoPreview]);

  // Phone validation state
  const [phoneStatus, setPhoneStatus] = useState('idle');
  const [phoneMessage, setPhoneMessage] = useState('');
  const phoneCheckRef = useRef(null);
  const initialPhoneValuesRef = useRef({ phone: '', father_phone: '', mother_phone: '' });

  // Email availability validation state
  const [emailStatus, setEmailStatus] = useState('idle');
  const [emailMessage, setEmailMessage] = useState('');
  const emailCheckRef = useRef(null);
  const emailRequestIdRef = useRef(0);

  // Parent phone validation state
  const [fatherPhoneStatus, setFatherPhoneStatus] = useState('idle');
  const [fatherPhoneMessage, setFatherPhoneMessage] = useState('');
  const fatherPhoneCheckRef = useRef(null);
  const [motherPhoneStatus, setMotherPhoneStatus] = useState('idle');
  const [motherPhoneMessage, setMotherPhoneMessage] = useState('');
  const motherPhoneCheckRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      photoProcessingIdRef.current += 1;
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    photoProcessingIdRef.current += 1;
    setPhotoFile(null);

    if (isOpen) {
      fetchCabors();
      fetchOrganizations();
      fetchEducationLevels();
      setStep(1);
      setErrors({});
      setErrorMessage('');
      emailCheckRef.current?.abort();
      emailRequestIdRef.current += 1;
      setEmailStatus('idle');
      setEmailMessage('');
      
      if (athlete) {
        const savedPhone = normalizeIndonesianMobile(athlete.phone) ?? athlete.phone ?? '';
        const savedFatherPhone = normalizeIndonesianMobile(athlete.father_phone) ?? athlete.father_phone ?? '';
        const savedMotherPhone = normalizeIndonesianMobile(athlete.mother_phone) ?? athlete.mother_phone ?? '';
        initialPhoneValuesRef.current = {
          phone: savedPhone,
          father_phone: savedFatherPhone,
          mother_phone: savedMotherPhone,
        };

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
          national_athlete_number: athlete.national_athlete_number || '',
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
          phone: savedPhone,
          email: athlete.email || '',
          career_start_year: athlete.career_start_year || '',
          injury_illness_history: athlete.injury_illness_history || '',
          top_achievements: [
            athlete.top_achievements?.[0] || '',
            athlete.top_achievements?.[1] || '',
            athlete.top_achievements?.[2] || ''
          ],
          father_name: athlete.father_name || '',
          mother_name: athlete.mother_name || '',
          parent_address: athlete.parent_address || '',
          father_phone: savedFatherPhone,
          mother_phone: savedMotherPhone,
          is_active: athlete.is_active ?? true
        });
        setPhotoPreview(athlete.photo || null);
        setPhoneStatus(savedPhone ? (normalizeIndonesianMobile(savedPhone) ? 'valid' : 'invalid') : 'idle');
        setPhoneMessage(savedPhone ? (normalizeIndonesianMobile(savedPhone) ? 'Nomor tersimpan' : 'Format nomor WhatsApp tidak valid') : '');
        setFatherPhoneStatus(savedFatherPhone ? (normalizeIndonesianMobile(savedFatherPhone) ? 'valid' : 'invalid') : 'idle');
        setFatherPhoneMessage(savedFatherPhone ? (normalizeIndonesianMobile(savedFatherPhone) ? 'Nomor tersimpan' : 'Format nomor WhatsApp tidak valid') : '');
        setMotherPhoneStatus(savedMotherPhone ? (normalizeIndonesianMobile(savedMotherPhone) ? 'valid' : 'invalid') : 'idle');
        setMotherPhoneMessage(savedMotherPhone ? (normalizeIndonesianMobile(savedMotherPhone) ? 'Nomor tersimpan' : 'Format nomor WhatsApp tidak valid') : '');
      } else {
        initialPhoneValuesRef.current = { phone: '', father_phone: '', mother_phone: '' };
        setCompetitionClasses([]);
        setFormData({
          cabor_id: '', organization_id: '', education_level_id: '', competition_class_id: '', name: '', nik: '', national_athlete_number: '', no_kk: '',
          birth_place: '', birth_date: '', gender: '',
          religion: '', address: '', blood_type: '', occupation: '',
          marital_status: '', hobby: '', height: '', weight: '', phone: '', email: '',
          career_start_year: '', injury_illness_history: '',
          top_achievements: ['', '', ''],
          father_name: '', mother_name: '', parent_address: '', father_phone: '', mother_phone: '',
          is_active: true
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        setPhoneStatus('idle');
        setPhoneMessage('');
        setFatherPhoneStatus('idle');
        setFatherPhoneMessage('');
        setMotherPhoneStatus('idle');
        setMotherPhoneMessage('');
      }
    }
  }, [isOpen, athlete]);

  const fetchCabors = async () => {
    try {
      const res = await api.get('/api/cabors/all', { params: { level: 'discipline' } });
      // Ensure data is array and has valid IDs
      const data = Array.isArray(res.data) ? res.data.filter(item => item && item.id).map(item => ({ ...item, name: item.display_name || item.name })) : [];
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

  // Handle cabor change and only load competition classes when editing
  const handleCaborChange = (caborId) => {
    setFormData(prev => ({
      ...prev,
      cabor_id: caborId,
      competition_class_id: ''
    }));

    if (athlete) {
      fetchCompetitionClasses(caborId);
    } else {
      setCompetitionClasses([]);
    }
  };

  const handlePhotoChange = (e) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const processingId = ++photoProcessingIdRef.current;
    setPhotoFile(null);
    setPhotoPreview(athlete?.photo || null);

    const inputUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(inputUrl);
      if (processingId !== photoProcessingIdRef.current) return;

      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      const scale = Math.min(MAX_WIDTH / img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const context = canvas.getContext('2d');
      if (!context) {
        setErrorMessage('Foto gagal diproses. Silakan pilih file lain.');
        return;
      }
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (processingId !== photoProcessingIdRef.current) return;
        if (!blob) {
          setErrorMessage('Foto gagal diproses. Silakan pilih file lain.');
          return;
        }
        const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', { type: 'image/webp', lastModified: Date.now() });
        setPhotoFile(compressed);
        setPhotoPreview(URL.createObjectURL(compressed));
      }, 'image/webp', 0.82);
    };
    img.onerror = () => {
      URL.revokeObjectURL(inputUrl);
      if (processingId !== photoProcessingIdRef.current) return;
      setPhotoFile(null);
      setErrorMessage('Format foto tidak dapat diproses. Gunakan JPG, PNG, atau WebP.');
    };
    img.src = inputUrl;
  };
  // Debounced phone validation via n8n webhook with local fail-open fallback.
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
      setFormData(prev => ({ ...prev, phone: normalized }));
      return;
    }
    if (athlete?.id && normalized === initialPhoneValuesRef.current.phone) {
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
  }, [formData.phone, athlete?.id, isOpen]);
  // Debounced email availability validation against the backend.
  useEffect(() => {
    emailCheckRef.current?.abort();
    emailCheckRef.current = null;
    const requestId = ++emailRequestIdRef.current;
    const email = formData.email?.trim();

    if (!isOpen || !email) {
      setEmailStatus('idle');
      setEmailMessage('');
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setEmailStatus('invalid');
      setEmailMessage('Format email tidak valid');
      return;
    }

    const controller = new AbortController();
    emailCheckRef.current = controller;
    setEmailStatus('checking');
    setEmailMessage('Memeriksa email...');

    const timer = setTimeout(async () => {
      try {
        const params = { email };
        if (athlete?.id) {
          params.athlete_id = athlete.id;
        }
        const response = await api.get('/api/athletes/check-email', {
          params,
          signal: controller.signal
        });

        if (controller.signal.aborted || emailRequestIdRef.current !== requestId) {
          return;
        }
        if (response.data.available) {
          setEmailStatus('valid');
          setEmailMessage('Email tersedia');
        } else {
          setEmailStatus('invalid');
          setEmailMessage('Email sudah terdaftar');
        }
      } catch (error) {
        if (
          error.name === 'CanceledError' ||
          error.code === 'ERR_CANCELED' ||
          controller.signal.aborted ||
          emailRequestIdRef.current !== requestId
        ) {
          return;
        }
        setEmailStatus('error');
        setEmailMessage('Gagal memeriksa email, coba lagi');
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.email, isOpen, athlete?.id]);
  // Father phone validation.
  useEffect(() => {
    if (!isOpen) {
      setFatherPhoneStatus('idle');
      setFatherPhoneMessage('');
      return;
    }

    const phone = formData.father_phone?.trim();
    if (!phone) {
      setFatherPhoneStatus('idle');
      setFatherPhoneMessage('');
      return;
    }
    const normalized = normalizeIndonesianMobile(phone);
    if (!normalized) {
      setFatherPhoneStatus('invalid');
      setFatherPhoneMessage('Format nomor WhatsApp tidak valid');
      return;
    }
    if (normalized !== phone) {
      setFatherPhoneStatus('checking');
      setFatherPhoneMessage('Memeriksa nomor...');
      setFormData(prev => ({ ...prev, father_phone: normalized }));
      return;
    }
    if (athlete?.id && normalized === initialPhoneValuesRef.current.father_phone) {
      setFatherPhoneStatus('valid');
      setFatherPhoneMessage('Nomor tersimpan');
      return;
    }

    setFatherPhoneStatus('checking');
    setFatherPhoneMessage('Memeriksa nomor...');
    fatherPhoneCheckRef.current?.abort();
    const controller = new AbortController();
    fatherPhoneCheckRef.current = controller;
    const timer = setTimeout(async () => {
      try {
        const result = await checkWhatsAppPhone(normalized, controller.signal);
        if (controller.signal.aborted) return;
        setFatherPhoneStatus(result.status);
        setFatherPhoneMessage(result.message);
      } catch (error) {
        if (!isCanceledRequest(error)) {
          setFatherPhoneStatus('valid');
          setFatherPhoneMessage(PHONE_CHECK_SKIPPED_MESSAGE);
        }
      }
    }, 800);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.father_phone, athlete?.id, isOpen]);
  // Mother phone validation.
  useEffect(() => {
    if (!isOpen) {
      setMotherPhoneStatus('idle');
      setMotherPhoneMessage('');
      return;
    }

    const phone = formData.mother_phone?.trim();
    if (!phone) {
      setMotherPhoneStatus('idle');
      setMotherPhoneMessage('');
      return;
    }
    const normalized = normalizeIndonesianMobile(phone);
    if (!normalized) {
      setMotherPhoneStatus('invalid');
      setMotherPhoneMessage('Format nomor WhatsApp tidak valid');
      return;
    }
    if (normalized !== phone) {
      setMotherPhoneStatus('checking');
      setMotherPhoneMessage('Memeriksa nomor...');
      setFormData(prev => ({ ...prev, mother_phone: normalized }));
      return;
    }
    if (athlete?.id && normalized === initialPhoneValuesRef.current.mother_phone) {
      setMotherPhoneStatus('valid');
      setMotherPhoneMessage('Nomor tersimpan');
      return;
    }

    setMotherPhoneStatus('checking');
    setMotherPhoneMessage('Memeriksa nomor...');
    motherPhoneCheckRef.current?.abort();
    const controller = new AbortController();
    motherPhoneCheckRef.current = controller;
    const timer = setTimeout(async () => {
      try {
        const result = await checkWhatsAppPhone(normalized, controller.signal);
        if (controller.signal.aborted) return;
        setMotherPhoneStatus(result.status);
        setMotherPhoneMessage(result.message);
      } catch (error) {
        if (!isCanceledRequest(error)) {
          setMotherPhoneStatus('valid');
          setMotherPhoneMessage(PHONE_CHECK_SKIPPED_MESSAGE);
        }
      }
    }, 800);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.mother_phone, athlete?.id, isOpen]);
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateAchievement = (index, value) => {
    const newAchievements = [...formData.top_achievements];
    newAchievements[index] = value;
    setFormData(prev => ({ ...prev, top_achievements: newAchievements }));
  };

  // Validate current step
  const isStepValid = () => {
    if (step === 1) {
      // Step 1: Data Pribadi
      return (
        formData.name.trim() !== '' &&
        IDENTITY_PATTERN.test(formData.nik) &&
        IDENTITY_PATTERN.test(formData.no_kk) &&
        formData.birth_place.trim() !== '' &&
        formData.birth_date !== '' &&
        formData.gender !== '' &&
        formData.religion !== '' &&
        formData.cabor_id !== '' &&
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
        formData.email.trim() !== '' &&
        phoneStatus === 'valid' &&
        emailStatus === 'valid'
      );
    }
    // Step 3: Karir & Prestasi (prestasi optional)
    if (step === 3) {
      return formData.career_start_year !== '';
    }
    // Step 4: Data Orang Tua
    const fatherPhone = formData.father_phone.trim();
    const motherPhone = formData.mother_phone.trim();

    return (
      formData.father_name.trim() !== '' &&
      formData.mother_name.trim() !== '' &&
      formData.parent_address.trim() !== '' &&
      (fatherPhone !== '' || motherPhone !== '') &&
      (fatherPhone === '' || fatherPhoneStatus === 'valid') &&
      (motherPhone === '' || motherPhoneStatus === 'valid')
    );
  };

  // Go to next step with scroll to top
  const goToNextStep = () => {
    if (isStepValid() && step < 4) {
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
    const identityErrors = {};
    if (!IDENTITY_PATTERN.test(formData.nik)) {
      identityErrors.nik = ['NIK harus tepat 16 digit angka'];
    }
    if (!IDENTITY_PATTERN.test(formData.no_kk)) {
      identityErrors.no_kk = ['No. KK harus tepat 16 digit angka'];
    }
    if (Object.keys(identityErrors).length > 0) {
      setErrors(identityErrors);
      setErrorMessage(firstFieldError(Object.values(identityErrors)[0]));
      setStep(1);
      setTimeout(() => formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
      return;
    }

    const normalizedPhone = normalizeIndonesianMobile(formData.phone);
    const normalizedFatherPhone = normalizeIndonesianMobile(formData.father_phone);
    const normalizedMotherPhone = normalizeIndonesianMobile(formData.mother_phone);

    const contactErrors = {};
    if (!normalizedPhone) {
      contactErrors.phone = ['Format nomor WhatsApp tidak valid'];
    } else if (phoneStatus !== 'valid') {
      contactErrors.phone = [phoneMessage || 'Nomor WhatsApp harus valid sebelum menyimpan data'];
    }
    if (emailStatus !== 'valid') {
      contactErrors.email = [emailMessage || 'Email harus berhasil diperiksa sebelum menyimpan data'];
    }
    if (Object.keys(contactErrors).length > 0) {
      setErrors(contactErrors);
      setErrorMessage(firstFieldError(Object.values(contactErrors)[0]));
      setStep(2);
      setTimeout(() => formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
      return;
    }

    const parentPhoneErrors = {};
    if (formData.father_phone.trim() && !normalizedFatherPhone) {
      parentPhoneErrors.father_phone = ['Format nomor WhatsApp tidak valid'];
    } else if (normalizedFatherPhone && fatherPhoneStatus !== 'valid') {
      parentPhoneErrors.father_phone = [fatherPhoneMessage || 'Nomor WhatsApp ayah/wali harus valid sebelum menyimpan data'];
    }
    if (formData.mother_phone.trim() && !normalizedMotherPhone) {
      parentPhoneErrors.mother_phone = ['Format nomor WhatsApp tidak valid'];
    } else if (normalizedMotherPhone && motherPhoneStatus !== 'valid') {
      parentPhoneErrors.mother_phone = [motherPhoneMessage || 'Nomor WhatsApp ibu/wali harus valid sebelum menyimpan data'];
    }
    if (!formData.father_phone.trim() && !formData.mother_phone.trim()) {
      parentPhoneErrors.father_phone = ['Minimal salah satu nomor WhatsApp orang tua/wali wajib diisi'];
    }
    if (Object.keys(parentPhoneErrors).length > 0) {
      setErrors(parentPhoneErrors);
      setErrorMessage(firstFieldError(Object.values(parentPhoneErrors)[0]));
      setStep(4);
      setTimeout(() => formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
      return;
    }

    const submissionData = {
      ...formData,
      phone: normalizedPhone,
      father_phone: normalizedFatherPhone || '',
      mother_phone: normalizedMotherPhone || ''
    };

    setLoading(true);
    setErrors({});
    setErrorMessage('');

    try {
      const data = new FormData();
      
      Object.entries(submissionData).forEach(([key, value]) => {
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
        await api.post(`/api/athletes/${athlete.id}`, data);
      } else {
        await api.post('/api/athletes', data);
      }
      
      onSuccess();
    } catch (error) {
      if (error.response?.status === 422) {
        const rawErrors = error.response.data.errors || {};
        const errData = Object.fromEntries(
          Object.entries(rawErrors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages : [String(messages)]
          ])
        );
        setErrors(errData);
        if (errData.email) {
          setEmailStatus('invalid');
          setEmailMessage(firstFieldError(errData.email) || 'Email sudah terdaftar');
        }
        if (errData.phone) {
          setPhoneStatus('invalid');
          setPhoneMessage(firstFieldError(errData.phone) || 'Format nomor WhatsApp tidak valid');
        }
        if (errData.father_phone) {
          setFatherPhoneStatus('invalid');
          setFatherPhoneMessage(firstFieldError(errData.father_phone) || 'Format nomor WhatsApp tidak valid');
        }
        if (errData.mother_phone) {
          setMotherPhoneStatus('invalid');
          setMotherPhoneMessage(firstFieldError(errData.mother_phone) || 'Format nomor WhatsApp tidak valid');
        }
        
        // Build error message from all errors
        const messages = Object.values(errData).flat();
        setErrorMessage(messages.length > 0 ? messages[0] : 'Terjadi kesalahan validasi');
        
        // Determine which step has the first error and go there
        const step1Fields = ['name', 'nik', 'no_kk', 'birth_place', 'birth_date', 'gender', 'religion', 'cabor_id', 'competition_class', 'address'];
        const step2Fields = ['height', 'weight', 'blood_type', 'education_level_id', 'occupation', 'marital_status', 'phone', 'email'];
        const step4Fields = ['father_name', 'mother_name', 'parent_address', 'father_phone', 'mother_phone'];
        
        const errorFields = Object.keys(errData);
        if (errorFields.some(f => step1Fields.includes(f))) {
          setStep(1);
        } else if (errorFields.some(f => step2Fields.includes(f))) {
          setStep(2);
        } else if (errorFields.some(f => step4Fields.includes(f))) {
          setStep(4);
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

  const nikInvalid = Boolean(errors.nik) || (formData.nik !== '' && !IDENTITY_PATTERN.test(formData.nik));
  const noKKInvalid = Boolean(errors.no_kk) || (formData.no_kk !== '' && !IDENTITY_PATTERN.test(formData.no_kk));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <MotionDiv
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <MotionDiv
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
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">NIK *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.nik}
                      onChange={e => updateField('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 outline-none font-mono transition-colors ${
                        nikInvalid
                          ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500'
                          : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
                      }`}
                      placeholder="16 digit NIK"
                      maxLength={16}
                    />
                    <div className="mt-1 flex items-start justify-between gap-2 text-xs">
                      <p className={nikInvalid ? 'text-red-500' : 'text-slate-500'}>
                        {firstFieldError(errors.nik) || (nikInvalid ? 'NIK harus tepat 16 digit angka' : 'NIK wajib tepat 16 digit angka')}
                      </p>
                      <span className={nikInvalid ? 'text-red-500' : 'text-slate-400'}>{formData.nik.length}/16 digit</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">No. Atlit Nasional</label>
                    <input
                      type="text"
                      value={formData.national_athlete_number}
                      onChange={e => updateField('national_athlete_number', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="Nomor Atlit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">No. KK *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.no_kk}
                      onChange={e => updateField('no_kk', e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 outline-none font-mono transition-colors ${
                        noKKInvalid
                          ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500'
                          : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
                      }`}
                      placeholder="16 digit No. KK"
                      maxLength={16}
                    />
                    <div className="mt-1 flex items-start justify-between gap-2 text-xs">
                      <p className={noKKInvalid ? 'text-red-500' : 'text-slate-500'}>
                        {firstFieldError(errors.no_kk) || (noKKInvalid ? 'No. KK harus tepat 16 digit angka' : 'No. KK wajib tepat 16 digit angka')}
                      </p>
                      <span className={noKKInvalid ? 'text-red-500' : 'text-slate-400'}>{formData.no_kk.length}/16 digit</span>
                    </div>
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
                    <DateInput
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
                  {athlete && (
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
                  )}
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">No. Whatsapp</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => updateField('phone', e.target.value)}
                        className={`w-full px-4 py-2.5 pr-10 border rounded-xl focus:ring-2 outline-none transition-colors ${
                          phoneStatus === 'valid' ? 'border-green-400 focus:ring-green-100 focus:border-green-500' :
                          phoneStatus === 'invalid' ? 'border-red-400 focus:ring-red-100 focus:border-red-500' :
                          'border-slate-200 focus:ring-red-100 focus:border-red-500'
                        }`}
                        placeholder="08xxxxxxxxxx"
                      />
                      {/* Status indicator */}
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => updateField('email', e.target.value)}
                        className={`w-full px-4 py-2.5 pr-10 border rounded-xl focus:ring-2 outline-none transition-colors ${
                          emailStatus === 'valid'
                            ? 'border-green-400 bg-green-50 focus:ring-green-100 focus:border-green-500'
                            : emailStatus === 'invalid' || emailStatus === 'error' || errors.email
                              ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500'
                              : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
                        }`}
                        placeholder="email@example.com"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                        {emailStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {(emailStatus === 'invalid' || emailStatus === 'error') && <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                    {(emailMessage || errors.email) && (
                      <p className={`text-xs mt-1 ${
                        emailStatus === 'valid'
                          ? 'text-green-600'
                          : emailStatus === 'invalid' || emailStatus === 'error' || errors.email
                            ? 'text-red-500'
                            : 'text-slate-500'
                      }`}>
                        {firstFieldError(errors.email) || emailMessage}
                      </p>
                    )}
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

            {/* Step 4: Data Orang Tua / Wali */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Ayah <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.father_name}
                      onChange={e => updateField('father_name', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="Nama lengkap ayah"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Ibu <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.mother_name}
                      onChange={e => updateField('mother_name', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="Nama lengkap ibu"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Orang Tua <span className="text-red-500">*</span></label>
                  <textarea
                    value={formData.parent_address}
                    onChange={e => updateField('parent_address', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
                    rows={3}
                    placeholder="Alamat lengkap orang tua/wali"
                  />
                </div>

                <div>
                  <p className="text-sm text-slate-600">
                    Minimal salah satu nomor WhatsApp orang tua/wali wajib diisi dan terverifikasi.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Father Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Ayah/Wali</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.father_phone}
                        onChange={e => updateField('father_phone', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none pr-10 ${
                          fatherPhoneStatus === 'valid' ? 'border-green-300 bg-green-50' :
                          fatherPhoneStatus === 'invalid' ? 'border-red-300 bg-red-50' :
                          'border-slate-200'
                        }`}
                        placeholder="08xxxxxxxxxx"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {fatherPhoneStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                        {fatherPhoneStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {fatherPhoneStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                    {fatherPhoneMessage && (
                      <p className={`text-xs mt-1 ${fatherPhoneStatus === 'valid' ? 'text-green-600' : fatherPhoneStatus === 'invalid' ? 'text-red-600' : 'text-slate-500'}`}>
                        {fatherPhoneMessage}
                      </p>
                    )}
                  </div>

                  {/* Mother Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Ibu/Wali</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.mother_phone}
                        onChange={e => updateField('mother_phone', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none pr-10 ${
                          motherPhoneStatus === 'valid' ? 'border-green-300 bg-green-50' :
                          motherPhoneStatus === 'invalid' ? 'border-red-300 bg-red-50' :
                          'border-slate-200'
                        }`}
                        placeholder="08xxxxxxxxxx"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {motherPhoneStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                        {motherPhoneStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {motherPhoneStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                    {motherPhoneMessage && (
                      <p className={`text-xs mt-1 ${motherPhoneStatus === 'valid' ? 'text-green-600' : motherPhoneStatus === 'invalid' ? 'text-red-600' : 'text-slate-500'}`}>
                        {motherPhoneMessage}
                      </p>
                    )}
                  </div>
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

            {step < 4 ? (
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
                disabled={loading || !isStepValid()}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {athlete ? 'Update Atlet' : 'Simpan Atlet'}
              </button>
            )}
          </div>
        </div>
      </MotionDiv>
    </AnimatePresence>
  );
}
