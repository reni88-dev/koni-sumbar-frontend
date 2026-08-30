import { formatDateForInput } from '../form-modal/formUtils';
import { normalizeIndonesianMobile } from '../form-modal/phoneUtils';
import { COACH_EMAIL_PATTERN, COACH_IDENTITY_PATTERN } from './coachProfileValidation';

export const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];
export const GENDERS = [
  { value: 'male', label: 'Laki-laki' },
  { value: 'female', label: 'Perempuan' }
];
export const LICENSE_LEVELS = ['Nasional', 'Daerah', 'Internasional'];
export const IDENTITY_PATTERN = COACH_IDENTITY_PATTERN;
export const EMAIL_PATTERN = COACH_EMAIL_PATTERN;

export function createInitialCoachFormData() {
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
    province: '',
    city: '',
    district: '',
    village: '',
    phone: '',
    email: '',
    license_number: '',
    license_level: '',
    coaching_start_year: '',
    specialization: '',
    is_active: true
  };
}

export function parseAchievementsForForm(achievements) {
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
        list = trimmed.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      }
    } else {
      list = trimmed.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    }
  }

  if (list.length === 0) return ['', '', ''];
  while (list.length < 3) list.push('');
  return list;
}

export function mapCoachToForm(coach) {
  const savedPhone = normalizeIndonesianMobile(coach.phone) ?? coach.phone ?? '';
  return {
    formData: {
      name: coach.name || '',
      nik: coach.nik || '',
      cabor_id: coach.cabor_id?.toString() || coach.cabor?.id?.toString() || '',
      organization_id: coach.organization_id?.toString() || '',
      birth_place: coach.birth_place || '',
      birth_date: formatDateForInput(coach.birth_date, { allowDateFallback: true }),
      gender: coach.gender || '',
      religion: coach.religion || '',
      address: coach.address || '',
      province: coach.province || '',
      city: coach.city || '',
      district: coach.district || '',
      village: coach.village || '',
      phone: savedPhone,
      email: coach.email || '',
      license_number: coach.license_number || '',
      license_level: coach.license_level || '',
      coaching_start_year: coach.coaching_start_year?.toString() || '',
      specialization: coach.specialization || '',
      is_active: coach.is_active ?? true
    },
    achievements: parseAchievementsForForm(coach.achievements),
    savedPhone
  };
}

export function buildCoachFormData(
  formData,
  achievementsList,
  files,
  normalizedPhone,
  { excludedFields = [], includeEmptyFields = false } = {}
) {
  const data = new FormData();
  const excluded = new Set(excludedFields);
  const submissionData = { ...formData, phone: normalizedPhone || '' };
  Object.entries(submissionData).forEach(([key, value]) => {
    if (excluded.has(key)) return;
    if (key === 'is_active') {
      data.append(key, value ? 'true' : 'false');
    } else if (includeEmptyFields || (value !== '' && value !== null && value !== undefined)) {
      data.append(key, value ?? '');
    }
  });

  const filteredAchievements = achievementsList.filter((item) => item && item.trim() !== '');
  data.append('achievements', filteredAchievements.length > 0
    ? JSON.stringify(filteredAchievements)
    : '');
  if (files.photoFile) data.append('photo', files.photoFile);
  if (files.certificateFile) data.append('certificate_document', files.certificateFile);
  if (files.identityDocumentFile) data.append('identity_document', files.identityDocumentFile);
  if (files.bpjsDocumentFile) data.append('bpjs_document', files.bpjsDocumentFile);
  return data;
}

export function getCoachErrorStep(errorFields) {
  const step1Fields = ['name', 'nik', 'cabor_id', 'organization_id', 'birth_place', 'birth_date', 'gender', 'religion', 'address', 'province', 'city', 'district', 'village', 'photo', 'identity_document', 'bpjs_document'];
  const step2Fields = ['phone', 'email'];
  if (errorFields.some((field) => step1Fields.includes(field))) return 1;
  if (errorFields.some((field) => step2Fields.includes(field))) return 2;
  return 3;
}
