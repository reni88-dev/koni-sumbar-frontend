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
  Heart,
  Activity,
  Phone,
  Calendar,
  Award,
  Trophy,
  Camera,
  Briefcase
} from 'lucide-react';
import api from '../api/axios';
import { DateInput } from './DateInput';
import ProtectedImage from './ProtectedImage';
import { SearchableSelect } from './SearchableSelect';

const STEPS = [
  { id: 1, title: 'Data Pribadi', subtitle: 'Biodata & Dokumen', icon: User },
  { id: 2, title: 'Fisik & Kontak', subtitle: 'Ukuran, Medis & Akun', icon: Activity },
  { id: 3, title: 'Karir & Prestasi', subtitle: 'Cabor & Riwayat Juara', icon: Trophy },
  { id: 4, title: 'Data Orang Tua', subtitle: 'Wali & Kontak Darurat', icon: Heart }
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
const MAX_SOURCE_FILE_SIZE = 10 * 1024 * 1024;
const DOCUMENT_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp';
const DOCUMENT_MIME_BY_EXTENSION = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
};
const IDENTITY_DOCUMENT_LABELS = {
  ktp: 'KTP',
  family_card: 'Kartu Keluarga (KK)',
  birth_certificate: 'Akte Kelahiran'
};

const parseDateInput = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

const getAthleteAgeGroup = (birthDateValue, today = new Date()) => {
  const birthDate = parseDateInput(birthDateValue);
  if (!birthDate) return null;
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (birthDate > currentDate) return null;
  const seventeenthBirthday = new Date(
    birthDate.getFullYear() + 17,
    birthDate.getMonth(),
    birthDate.getDate()
  );
  return currentDate >= seventeenthBirthday ? 'adult' : 'minor';
};

const isIdentityTypeValidForAge = (documentType, ageGroup) => (
  ageGroup === 'adult'
    ? documentType === 'ktp'
    : ageGroup === 'minor' && ['family_card', 'birth_certificate'].includes(documentType)
);

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
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  const match = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  return '';
};

// Sub-component for structured form cards
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

export function AthleteFormModal({ isOpen, onClose, athlete, onSuccess }) {
  const formContainerRef = useRef(null);
  const photoProcessingIdRef = useRef(0);
  const identityProcessingIdRef = useRef(0);
  const bpjsProcessingIdRef = useRef(0);
  const lastValidAgeGroupRef = useRef(null);
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
    birth_place: '', birth_date: '', gender: '', identity_document_type: '',
    religion: '', address: '', blood_type: '', occupation: '',
    marital_status: '', hobby: '', height: '', weight: '', phone: '', email: '',
    career_start_year: '', injury_illness_history: '',
    top_achievements: ['', '', ''],
    father_name: '', mother_name: '', parent_address: '', father_phone: '', mother_phone: '',
    is_active: true
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [identityDocumentFile, setIdentityDocumentFile] = useState(null);
  const [bpjsDocumentFile, setBPJSDocumentFile] = useState(null);
  const [documentProcessing, setDocumentProcessing] = useState({ identity: false, bpjs: false });
  const [documentErrors, setDocumentErrors] = useState({ identity: '', bpjs: '' });

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
    photoProcessingIdRef.current += 1;
    identityProcessingIdRef.current += 1;
    bpjsProcessingIdRef.current += 1;
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoProcessing(false);
    setIdentityDocumentFile(null);
    setBPJSDocumentFile(null);
    setDocumentProcessing({ identity: false, bpjs: false });
    setDocumentErrors({ identity: '', bpjs: '' });
    setLoading(false);
    setErrors({});
    setErrorMessage('');

    if (!isOpen) {
      emailCheckRef.current?.abort();
      phoneCheckRef.current?.abort();
      fatherPhoneCheckRef.current?.abort();
      motherPhoneCheckRef.current?.abort();
      lastValidAgeGroupRef.current = null;
      return;
    }

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
        const savedBirthDate = formatDateForInput(athlete.birth_date);
        const savedAgeGroup = getAthleteAgeGroup(savedBirthDate);
        lastValidAgeGroupRef.current = savedAgeGroup;
        const savedIdentityType = savedAgeGroup === 'adult'
          ? 'ktp'
          : (['family_card', 'birth_certificate'].includes(athlete.identity_document_type)
            ? athlete.identity_document_type
            : '');
        initialPhoneValuesRef.current = {
          phone: savedPhone,
          father_phone: savedFatherPhone,
          mother_phone: savedMotherPhone,
        };

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
          birth_date: savedBirthDate,
          gender: athlete.gender || '',
          identity_document_type: savedIdentityType,
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
        lastValidAgeGroupRef.current = null;
        setCompetitionClasses([]);
        setFormData({
          cabor_id: '', organization_id: '', education_level_id: '', competition_class_id: '', name: '', nik: '', national_athlete_number: '', no_kk: '',
          birth_place: '', birth_date: '', gender: '', identity_document_type: '',
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

  useEffect(() => {
    if (!isOpen) return;
    const ageGroup = getAthleteAgeGroup(formData.birth_date);
    setFormData(prev => {
      if (ageGroup === 'adult' && prev.identity_document_type !== 'ktp') {
        return { ...prev, identity_document_type: 'ktp' };
      }
      if (ageGroup === 'minor' && prev.identity_document_type === 'ktp') {
        return { ...prev, identity_document_type: '' };
      }
      return prev;
    });
  }, [formData.birth_date, isOpen]);

  const fetchCabors = async () => {
    try {
      const res = await api.get('/api/cabors/all', { params: { level: 'discipline' } });
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
      const res = await api.get(`/api/competition-classes/all?cabor_id=${caborId}`);
      const data = Array.isArray(res.data) ? res.data.filter(c => c && c.id) : [];
      setCompetitionClasses(data);
    } catch (e) { 
      console.error('Failed to fetch competition classes:', e);
      setCompetitionClasses([]);
    }
  };

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

  const handleBirthDateChange = (value) => {
    const previousAgeGroup = getAthleteAgeGroup(formData.birth_date) || lastValidAgeGroupRef.current;
    const nextAgeGroup = getAthleteAgeGroup(value);
    if (previousAgeGroup && nextAgeGroup && previousAgeGroup !== nextAgeGroup) {
      identityProcessingIdRef.current += 1;
      setIdentityDocumentFile(null);
      setDocumentProcessing(prev => ({ ...prev, identity: false }));
      setDocumentErrors(prev => ({
        ...prev,
        identity: 'Kelompok umur berubah. Unggah dokumen identitas pengganti yang sesuai.'
      }));
    }
    if (nextAgeGroup) {
      lastValidAgeGroupRef.current = nextAgeGroup;
    }
    updateField('birth_date', value);
  };

  const handlePhotoChange = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const processingId = ++photoProcessingIdRef.current;
    setPhotoFile(null);
    setPhotoPreview(athlete?.photo || null);
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

  const handleDocumentChange = (kind) => async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (kind === 'identity' && !getAthleteAgeGroup(formData.birth_date)) {
      setDocumentErrors(prev => ({ ...prev, identity: 'Isi tanggal lahir yang valid terlebih dahulu.' }));
      return;
    }

    const processingRef = kind === 'identity' ? identityProcessingIdRef : bpjsProcessingIdRef;
    const processingId = ++processingRef.current;
    if (kind === 'identity') {
      setIdentityDocumentFile(null);
    } else {
      setBPJSDocumentFile(null);
    }
    setDocumentErrors(prev => ({ ...prev, [kind]: '' }));
    setDocumentProcessing(prev => ({ ...prev, [kind]: true }));

    try {
      const { extension } = validateSourceFile(file, { allowPDF: true });
      const processedFile = extension === 'pdf'
        ? file
        : await compressImageToWebP(file, { maxLongest: 1600 });
      if (processingId !== processingRef.current) return;
      if (kind === 'identity') {
        setIdentityDocumentFile(processedFile);
        setErrors(prev => {
          const next = { ...prev };
          delete next.identity_document;
          return next;
        });
      } else {
        setBPJSDocumentFile(processedFile);
        setErrors(prev => {
          const next = { ...prev };
          delete next.bpjs_document;
          return next;
        });
      }
    } catch (error) {
      if (processingId !== processingRef.current) return;
      setDocumentErrors(prev => ({
        ...prev,
        [kind]: error.message || 'Dokumen gagal diproses. Silakan pilih file lain.'
      }));
    } finally {
      if (processingId === processingRef.current) {
        setDocumentProcessing(prev => ({ ...prev, [kind]: false }));
      }
    }
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

  const ageGroup = getAthleteAgeGroup(formData.birth_date);
  const storedIdentityType = athlete?.identity_document_type || '';
  const canReuseStoredIdentity = Boolean(athlete?.identity_document) &&
    isIdentityTypeValidForAge(storedIdentityType, ageGroup) &&
    formData.identity_document_type === storedIdentityType;
  const canReuseStoredBPJS = Boolean(athlete?.bpjs_document);
  const isAnyFileProcessing = photoProcessing || documentProcessing.identity || documentProcessing.bpjs;

  const getDocumentValidationErrors = () => {
    const validationErrors = {};
    if (!ageGroup) {
      validationErrors.birth_date = ['Tanggal lahir wajib valid dan tidak boleh di masa depan'];
    } else if (!isIdentityTypeValidForAge(formData.identity_document_type, ageGroup)) {
      validationErrors.identity_document_type = [ageGroup === 'adult'
        ? 'Atlet berusia 17 tahun atau lebih wajib menggunakan KTP'
        : 'Pilih KK atau Akte Kelahiran untuk atlet di bawah 17 tahun'];
    }
    if (!identityDocumentFile && !canReuseStoredIdentity) {
      validationErrors.identity_document = [athlete?.identity_document
        ? 'Dokumen identitas tersimpan tidak sesuai. Unggah dokumen pengganti.'
        : 'Dokumen identitas wajib diunggah'];
    }
    if (!bpjsDocumentFile && !canReuseStoredBPJS) {
      validationErrors.bpjs_document = ['Dokumen BPJS wajib diunggah'];
    }
    if (documentErrors.identity) {
      validationErrors.identity_document = [documentErrors.identity];
    }
    if (documentErrors.bpjs) {
      validationErrors.bpjs_document = [documentErrors.bpjs];
    }
    return validationErrors;
  };

  // Validate current step
  const isStepValid = () => {
    if (step === 1) {
      return (
        formData.name.trim() !== '' &&
        IDENTITY_PATTERN.test(formData.nik) &&
        IDENTITY_PATTERN.test(formData.no_kk) &&
        formData.birth_place.trim() !== '' &&
        formData.birth_date !== '' &&
        formData.gender !== '' &&
        formData.religion !== '' &&
        formData.cabor_id !== '' &&
        formData.address.trim() !== '' &&
        Object.keys(getDocumentValidationErrors()).length === 0 &&
        !isAnyFileProcessing
      );
    }
    if (step === 2) {
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
    if (step === 3) {
      return formData.career_start_year !== '';
    }
    
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

  const goToNextStep = () => {
    if (isStepValid() && step < 4) {
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
    if (loading || isAnyFileProcessing) return;

    const identityErrors = { ...getDocumentValidationErrors() };
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
          const filtered = value.filter(v => v && v.trim() !== '');
          data.append(key, JSON.stringify(filtered.length > 0 ? filtered : []));
        } else if (key === 'is_active') {
          data.append(key, value ? '1' : '0');
        } else if (value !== '' && value !== null && value !== undefined) {
          data.append(key, value);
        }
      });
      
      if (photoFile) data.append('photo', photoFile);
      if (identityDocumentFile) data.append('identity_document', identityDocumentFile);
      if (bpjsDocumentFile) data.append('bpjs_document', bpjsDocumentFile);

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
        
        const messages = Object.values(errData).flat();
        setErrorMessage(messages.length > 0 ? messages[0] : 'Terjadi kesalahan validasi');
        
        const step1Fields = ['name', 'nik', 'no_kk', 'birth_place', 'birth_date', 'gender', 'religion', 'cabor_id', 'competition_class', 'address', 'identity_document_type', 'identity_document', 'bpjs_document'];
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
        
        setTimeout(() => {
          formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
      } else {
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
      {/* Backdrop */}
      <Motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <Motion.div
        key="modal-content"
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
                  <span>KONI SUMATERA BARAT &bull; FORM DATA ATLET</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                  {athlete ? `Edit Data: ${athlete.name}` : 'Registrasi Atlet Baru'}
                </h2>
                <p className="text-xs text-red-100/80 mt-0.5">
                  Lengkapi data profil atlet secara teliti pada 4 tahapan formulir berikut.
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
            <div className="hidden sm:grid sm:grid-cols-4 gap-2">
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
                  Langkah {step} dari 4
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
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

            {/* STEP 1: DATA PRIBADI & DOKUMEN */}
            {step === 1 && (
              <div className="space-y-4">
                {/* 1. Foto Profil Atlet */}
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
                      <h4 className="text-sm font-bold text-slate-800">Pas Foto Atlet</h4>
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
                        <span>{photoProcessing ? 'Memproses Foto...' : photoPreview ? 'Ganti Foto' : 'Pilih Foto Atlet'}</span>
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

                {/* 2. Identitas Utama Kependudukan */}
                <FormSectionCard
                  icon={User}
                  iconColor="text-blue-600"
                  iconBg="bg-blue-50"
                  title="Identitas Utama & Kependudukan"
                  subtitle="Nama lengkap dan data nomor identitas kependudukan resmi"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => updateField('name', e.target.value)}
                      className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 outline-none text-sm transition-colors ${
                        errors.name ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500' : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
                      }`}
                      placeholder="Masukkan nama lengkap sesuai KTP/KK"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.name)}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.nik}
                      onChange={e => updateField('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 outline-none font-mono text-sm transition-colors ${
                        nikInvalid
                          ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500'
                          : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
                      }`}
                      placeholder="16 digit angka NIK"
                      maxLength={16}
                    />
                    <div className="mt-1 flex items-start justify-between gap-2 text-xs">
                      <p className={nikInvalid ? 'text-red-500' : 'text-slate-400'}>
                        {firstFieldError(errors.nik) || (nikInvalid ? 'NIK harus tepat 16 digit angka' : 'Wajib 16 digit angka')}
                      </p>
                      <span className={`font-mono ${formData.nik.length === 16 ? 'text-emerald-600 font-bold' : nikInvalid ? 'text-red-500' : 'text-slate-400'}`}>
                        {formData.nik.length}/16
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nomor Kartu Keluarga (No. KK) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.no_kk}
                      onChange={e => updateField('no_kk', e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 outline-none font-mono text-sm transition-colors ${
                        noKKInvalid
                          ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500'
                          : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
                      }`}
                      placeholder="16 digit angka No. KK"
                      maxLength={16}
                    />
                    <div className="mt-1 flex items-start justify-between gap-2 text-xs">
                      <p className={noKKInvalid ? 'text-red-500' : 'text-slate-400'}>
                        {firstFieldError(errors.no_kk) || (noKKInvalid ? 'No. KK harus tepat 16 digit angka' : 'Wajib 16 digit angka')}
                      </p>
                      <span className={`font-mono ${formData.no_kk.length === 16 ? 'text-emerald-600 font-bold' : noKKInvalid ? 'text-red-500' : 'text-slate-400'}`}>
                        {formData.no_kk.length}/16
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nomor Atlet Nasional (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.national_athlete_number}
                      onChange={e => updateField('national_athlete_number', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                      placeholder="Contoh: NAT-SUMBAR-2024-001"
                    />
                  </div>
                </FormSectionCard>

                {/* 3. Kelahiran, Agama & Alamat */}
                <FormSectionCard
                  icon={Calendar}
                  iconColor="text-amber-600"
                  iconBg="bg-amber-50"
                  title="Kelahiran & Domisili"
                  subtitle="Tempat & tanggal lahir, jenis kelamin, agama dan domisili"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tempat Lahir <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.birth_place}
                      onChange={e => updateField('birth_place', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                      placeholder="Kota/Kabupaten kelahiran"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tanggal Lahir <span className="text-red-500">*</span>
                    </label>
                    <DateInput
                      value={formData.birth_date}
                      onChange={e => handleBirthDateChange(e.target.value)}
                      className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm ${
                        errors.birth_date ? 'border-red-400 bg-red-50' : 'border-slate-200'
                      }`}
                    />
                    {errors.birth_date && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.birth_date)}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Jenis Kelamin <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={e => updateField('gender', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white cursor-pointer"
                    >
                      <option value="">-- Pilih Jenis Kelamin --</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Agama <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.religion}
                      onChange={e => updateField('religion', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white cursor-pointer"
                    >
                      <option value="">-- Pilih Agama --</option>
                      {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Alamat Lengkap Domisili <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={e => updateField('address', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm resize-none"
                      rows={2}
                      placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten"
                    />
                  </div>
                </FormSectionCard>

                {/* 4. Dokumen Wajib Identitas & BPJS */}
                <FormSectionCard
                  icon={FileText}
                  iconColor="text-indigo-600"
                  iconBg="bg-indigo-50"
                  title="Dokumen Wajib Verifikasi"
                  subtitle="Unggah scan/foto identitas resmi dan kartu BPJS Kesehatan/Ketenagakerjaan"
                >
                  {/* Dokumen Identitas Box */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Dokumen Identitas <span className="text-red-500">*</span>
                      </label>
                      {ageGroup && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ageGroup === 'adult' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ageGroup === 'adult' ? 'Usia 17+ (Wajib KTP)' : 'Usia Di Bawah 17 Thn (KK/Akte)'}
                        </span>
                      )}
                    </div>

                    {ageGroup === 'adult' ? (
                      <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        <span>KTP Elektronik</span>
                      </div>
                    ) : ageGroup === 'minor' ? (
                      <select
                        value={formData.identity_document_type}
                        onChange={e => updateField('identity_document_type', e.target.value)}
                        className={`w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-xs bg-white ${
                          errors.identity_document_type ? 'border-red-400 bg-red-50' : 'border-slate-200'
                        }`}
                      >
                        <option value="">-- Pilih Jenis Dokumen (Di Bawah 17 Thn) --</option>
                        <option value="family_card">Kartu Keluarga (KK)</option>
                        <option value="birth_certificate">Akte Kelahiran</option>
                      </select>
                    ) : (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                        Isi tanggal lahir atlet terlebih dahulu untuk menentukan jenis dokumen identitas.
                      </p>
                    )}
                    {errors.identity_document_type && (
                      <p className="text-red-500 text-xs">{firstFieldError(errors.identity_document_type)}</p>
                    )}

                    <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed rounded-xl transition-all ${
                      !ageGroup || documentProcessing.identity
                        ? 'cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                        : 'cursor-pointer bg-white border-slate-300 hover:border-red-400 hover:bg-red-50/50 shadow-2xs'
                    }`}>
                      {documentProcessing.identity ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Upload className="w-4 h-4 text-slate-500" />}
                      <span className="text-xs font-bold text-slate-700">
                        {documentProcessing.identity ? 'Memproses dokumen...' : 'Pilih Dokumen Identitas'}
                      </span>
                      <input
                        type="file"
                        accept={DOCUMENT_ACCEPT}
                        onChange={handleDocumentChange('identity')}
                        disabled={!ageGroup || documentProcessing.identity}
                        className="hidden"
                      />
                    </label>

                    {identityDocumentFile ? (
                      <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">File siap: {identityDocumentFile.name}</span>
                      </p>
                    ) : canReuseStoredIdentity ? (
                      <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{IDENTITY_DOCUMENT_LABELS[storedIdentityType]} sudah tersimpan di server</span>
                      </p>
                    ) : athlete?.identity_document ? (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        Dokumen tersimpan tidak sesuai dengan kelompok umur saat ini. Harap unggah dokumen pengganti.
                      </p>
                    ) : null}

                    {(documentErrors.identity || errors.identity_document) && (
                      <p className="text-red-500 text-xs">{documentErrors.identity || firstFieldError(errors.identity_document)}</p>
                    )}
                  </div>

                  {/* Dokumen BPJS Box */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Dokumen BPJS <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-500">Kesehatan/Naker</span>
                    </div>

                    <p className="text-xs text-slate-500">
                      Unggah scan kartu atau surat kepesertaan BPJS aktif (PDF, JPG, PNG, WebP maks. 10 MB).
                    </p>

                    <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed rounded-xl transition-all ${
                      documentProcessing.bpjs
                        ? 'cursor-wait bg-slate-100 text-slate-400 border-slate-200'
                        : 'cursor-pointer bg-white border-slate-300 hover:border-red-400 hover:bg-red-50/50 shadow-2xs'
                    }`}>
                      {documentProcessing.bpjs ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Upload className="w-4 h-4 text-slate-500" />}
                      <span className="text-xs font-bold text-slate-700">
                        {documentProcessing.bpjs ? 'Memproses dokumen...' : 'Pilih Dokumen BPJS'}
                      </span>
                      <input
                        type="file"
                        accept={DOCUMENT_ACCEPT}
                        onChange={handleDocumentChange('bpjs')}
                        disabled={documentProcessing.bpjs}
                        className="hidden"
                      />
                    </label>

                    {bpjsDocumentFile ? (
                      <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">File siap: {bpjsDocumentFile.name}</span>
                      </p>
                    ) : canReuseStoredBPJS ? (
                      <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Dokumen BPJS sudah tersimpan di server</span>
                      </p>
                    ) : null}

                    {(documentErrors.bpjs || errors.bpjs_document) && (
                      <p className="text-red-500 text-xs">{documentErrors.bpjs || firstFieldError(errors.bpjs_document)}</p>
                    )}
                  </div>
                </FormSectionCard>

                {/* 5. Cabang Olahraga & Organisasi */}
                <FormSectionCard
                  icon={Trophy}
                  iconColor="text-rose-600"
                  iconBg="bg-rose-50"
                  title="Cabang Olahraga & Pengcab"
                  subtitle="Afiliasi disiplin olahraga dan organisasi pengurus cabang"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Cabang Olahraga (Disiplin) <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={cabors}
                      value={formData.cabor_id}
                      onChange={(val) => handleCaborChange(val)}
                      placeholder="Cari & pilih cabang olahraga..."
                    />
                  </div>

                  {athlete && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Kelas Pertandingan
                      </label>
                      <SearchableSelect
                        options={competitionClasses}
                        value={formData.competition_class_id}
                        onChange={(val) => updateField('competition_class_id', val)}
                        placeholder={formData.cabor_id ? 'Pilih Kelas Pertandingan' : 'Pilih Cabor terlebih dahulu'}
                        disabled={!formData.cabor_id}
                      />
                    </div>
                  )}

                  <div className={athlete ? '' : 'sm:col-span-2'}>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Organisasi / Pengcab <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={organizations}
                      value={formData.organization_id}
                      onChange={(val) => updateField('organization_id', val)}
                      placeholder="Cari & pilih organisasi pengcab..."
                    />
                  </div>
                </FormSectionCard>
              </div>
            )}

            {/* STEP 2: FISIK & KONTAK */}
            {step === 2 && (
              <div className="space-y-4">
                {/* 1. Karakteristik Fisik & Pendidikan */}
                <FormSectionCard
                  icon={Activity}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                  title="Data Fisik & Pendidikan"
                  subtitle="Antropometri atlet, tingkat pendidikan, dan pekerjaan"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tinggi Badan (cm) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={e => updateField('height', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                      placeholder="Contoh: 175"
                      min={50}
                      max={300}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Berat Badan (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={e => updateField('weight', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                      placeholder="Contoh: 68.5"
                      min={20}
                      max={300}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Golongan Darah <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.blood_type}
                      onChange={e => updateField('blood_type', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white cursor-pointer"
                    >
                      <option value="">-- Pilih Golongan Darah --</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Pendidikan Terakhir <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.education_level_id}
                      onChange={e => updateField('education_level_id', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white cursor-pointer"
                    >
                      <option value="">-- Pilih Jenjang Pendidikan --</option>
                      {educationLevels.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Pekerjaan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={e => updateField('occupation', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                      placeholder="Contoh: Pelajar / Mahasiswa / Swasta"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Status Perkawinan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.marital_status}
                      onChange={e => updateField('marital_status', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white cursor-pointer"
                    >
                      <option value="">-- Pilih Status --</option>
                      {MARITAL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Hobi / Kegemaran
                    </label>
                    <input
                      type="text"
                      value={formData.hobby}
                      onChange={e => updateField('hobby', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                      placeholder="Contoh: Membaca, Bersepeda, Musik"
                    />
                  </div>
                </FormSectionCard>

                {/* 2. Kontak & Komunikasi */}
                <FormSectionCard
                  icon={Phone}
                  iconColor="text-purple-600"
                  iconBg="bg-purple-50"
                  title="Kontak & Komunikasi"
                  subtitle="Nomor WhatsApp aktif dan alamat email untuk verifikasi & notifikasi"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nomor WhatsApp Atlet <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => updateField('phone', e.target.value)}
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
                    {phoneMessage && (
                      <p className={`text-xs mt-1 font-medium ${
                        phoneStatus === 'valid' ? 'text-emerald-700' :
                        phoneStatus === 'invalid' ? 'text-red-500' :
                        'text-slate-400'
                      }`}>
                        {phoneMessage}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Alamat Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => updateField('email', e.target.value)}
                        className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl focus:ring-2 outline-none text-sm transition-colors ${
                          emailStatus === 'valid'
                            ? 'border-emerald-400 bg-emerald-50/40 focus:ring-emerald-100 focus:border-emerald-500'
                            : emailStatus === 'invalid' || emailStatus === 'error' || errors.email
                              ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500'
                              : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
                        }`}
                        placeholder="atlet@contoh.com"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                        {emailStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {(emailStatus === 'invalid' || emailStatus === 'error') && <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                    {(emailMessage || errors.email) && (
                      <p className={`text-xs mt-1 font-medium ${
                        emailStatus === 'valid'
                          ? 'text-emerald-700'
                          : emailStatus === 'invalid' || emailStatus === 'error' || errors.email
                            ? 'text-red-500'
                            : 'text-slate-500'
                      }`}>
                        {firstFieldError(errors.email) || emailMessage}
                      </p>
                    )}
                  </div>
                </FormSectionCard>
              </div>
            )}

            {/* STEP 3: KARIR & PRESTASI */}
            {step === 3 && (
              <div className="space-y-4">
                {/* 1. Tahun Karir & Status */}
                <FormSectionCard
                  icon={Briefcase}
                  iconColor="text-indigo-600"
                  iconBg="bg-indigo-50"
                  title="Informasi Karir & Keaktifan"
                  subtitle="Tahun awal berkarir dalam olahraga prestasi"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tahun Mulai Karir <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.career_start_year}
                      onChange={e => updateField('career_start_year', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                      placeholder="Contoh: 2018"
                      min={1950}
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Status Keaktifan Atlet
                    </label>
                    <div className="flex items-center gap-3 mt-1.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={e => updateField('is_active', e.target.checked)}
                        className="h-4 w-4 rounded-md accent-red-600 cursor-pointer"
                      />
                      <label htmlFor="is_active" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                        Atlet Aktif Membela KONI Sumatera Barat
                      </label>
                    </div>
                  </div>
                </FormSectionCard>

                {/* 2. Prestasi Tertinggi */}
                <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-amber-100/30 p-4 sm:p-5 shadow-xs">
                  <div className="mb-3 flex items-center gap-2.5 pb-2 border-b border-amber-200/60">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-200/80 text-amber-900">
                      <Award className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-amber-950">3 Prestasi Tertinggi</h3>
                      <p className="text-[11px] text-amber-800/80">Tuliskan medali / kejuaraan tertinggi yang pernah diraih atlet</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {formData.top_achievements.map((achievement, index) => {
                      const medalEmojis = ['🥇', '🥈', '🥉'];
                      const rankLabels = ['Prestasi Utama (Tertinggi)', 'Prestasi Kedua', 'Prestasi Ketiga'];
                      return (
                        <div key={`achievement-${index}`} className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none">
                            {medalEmojis[index]}
                          </span>
                          <input
                            type="text"
                            value={achievement}
                            onChange={e => updateAchievement(index, e.target.value)}
                            className="w-full pl-9 pr-3.5 py-2.5 border border-amber-300/80 bg-white rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 shadow-2xs"
                            placeholder={`${rankLabels[index]} (Contoh: Medali Emas PON XXI Aceh-Sumut 2024)`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Riwayat Cedera & Medis */}
                <FormSectionCard
                  icon={Activity}
                  iconColor="text-rose-600"
                  iconBg="bg-rose-50"
                  title="Riwayat Cedera & Medis"
                  subtitle="Catatan riwayat cedera fisik, operasi, atau penyakit yang perlu diperhatikan"
                >
                  <div className="sm:col-span-2">
                    <textarea
                      value={formData.injury_illness_history}
                      onChange={e => updateField('injury_illness_history', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm resize-none"
                      rows={3}
                      placeholder="Contoh: Cedera ACL lutut kanan (2022, sudah operasi dan pemulihan tuntas), atau isi '-' jika tidak ada."
                    />
                  </div>
                </FormSectionCard>
              </div>
            )}

            {/* STEP 4: DATA ORANG TUA / WALI */}
            {step === 4 && (
              <div className="space-y-4">
                {/* 1. Identitas Orang Tua / Wali */}
                <FormSectionCard
                  icon={Heart}
                  iconColor="text-rose-600"
                  iconBg="bg-rose-50"
                  title="Identitas Orang Tua / Wali"
                  subtitle="Nama lengkap orang tua kandung atau wali sah atlet"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Lengkap Ayah <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.father_name}
                      onChange={e => updateField('father_name', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                      placeholder="Nama lengkap ayah/wali"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Lengkap Ibu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.mother_name}
                      onChange={e => updateField('mother_name', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                      placeholder="Nama lengkap ibu/wali"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Alamat Orang Tua / Wali <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.parent_address}
                      onChange={e => updateField('parent_address', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm resize-none"
                      rows={2}
                      placeholder="Alamat lengkap tempat tinggal orang tua/wali"
                    />
                  </div>
                </FormSectionCard>

                {/* 2. Kontak Darurat WhatsApp Orang Tua */}
                <FormSectionCard
                  icon={Phone}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                  title="Kontak Darurat Orang Tua / Wali"
                  subtitle="Minimal salah satu nomor WhatsApp orang tua/wali wajib terdaftar dan terverifikasi"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      WhatsApp Ayah / Wali
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.father_phone}
                        onChange={e => updateField('father_phone', e.target.value)}
                        className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl focus:ring-2 outline-none font-mono text-sm transition-colors ${
                          fatherPhoneStatus === 'valid' ? 'border-emerald-400 bg-emerald-50/40 focus:ring-emerald-100 focus:border-emerald-500' :
                          fatherPhoneStatus === 'invalid' ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500' :
                          'border-slate-200 focus:ring-red-100 focus:border-red-500'
                        }`}
                        placeholder="Contoh: 081234567890"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {fatherPhoneStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                        {fatherPhoneStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {fatherPhoneStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                    {fatherPhoneMessage && (
                      <p className={`text-xs mt-1 font-medium ${
                        fatherPhoneStatus === 'valid' ? 'text-emerald-700' :
                        fatherPhoneStatus === 'invalid' ? 'text-red-500' :
                        'text-slate-400'
                      }`}>
                        {fatherPhoneMessage}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      WhatsApp Ibu / Wali
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.mother_phone}
                        onChange={e => updateField('mother_phone', e.target.value)}
                        className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl focus:ring-2 outline-none font-mono text-sm transition-colors ${
                          motherPhoneStatus === 'valid' ? 'border-emerald-400 bg-emerald-50/40 focus:ring-emerald-100 focus:border-emerald-500' :
                          motherPhoneStatus === 'invalid' ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500' :
                          'border-slate-200 focus:ring-red-100 focus:border-red-500'
                        }`}
                        placeholder="Contoh: 081234567890"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {motherPhoneStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                        {motherPhoneStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {motherPhoneStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                    {motherPhoneMessage && (
                      <p className={`text-xs mt-1 font-medium ${
                        motherPhoneStatus === 'valid' ? 'text-emerald-700' :
                        motherPhoneStatus === 'invalid' ? 'text-red-500' :
                        'text-slate-400'
                      }`}>
                        {motherPhoneMessage}
                      </p>
                    )}
                  </div>
                </FormSectionCard>
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

            {step < 4 ? (
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
                    <span>{athlete ? 'Simpan Perubahan' : 'Simpan Data Atlet'}</span>
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
