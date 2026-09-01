import { formatDateForInput } from '../form-modal/formUtils';
import { normalizeIndonesianMobile } from '../form-modal/phoneUtils';
import {
  ATHLETE_EMAIL_PATTERN,
  ATHLETE_IDENTITY_PATTERN,
  getAthleteAgeGroup,
  isIdentityTypeValidForAge,
} from './athleteProfileValidation';

export const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
export const MARITAL_STATUSES = [
  { value: 'single', label: 'Belum Menikah' },
  { value: 'married', label: 'Menikah' },
  { value: 'divorced', label: 'Cerai' },
  { value: 'widowed', label: 'Duda/Janda' }
];
export const IDENTITY_PATTERN = ATHLETE_IDENTITY_PATTERN;
export const EMAIL_PATTERN = ATHLETE_EMAIL_PATTERN;
export { getAthleteAgeGroup, isIdentityTypeValidForAge };
export const IDENTITY_DOCUMENT_LABELS = {
  ktp: 'KTP',
  family_card: 'Kartu Keluarga (KK)',
  birth_certificate: 'Akte Kelahiran'
};

export function createInitialAthleteFormData() {
  return {
    cabor_id: '',
    organization_id: '',
    education_level_id: '',
    competition_class_id: '',
    name: '',
    nik: '',
    national_athlete_number: '',
    no_kk: '',
    birth_place: '',
    birth_date: '',
    gender: '',
    identity_document_type: '',
    religion: '',
    address: '',
    province: '',
    city: '',
    district: '',
    village: '',
    blood_type: '',
    occupation: '',
    marital_status: '',
    hobby: '',
    height: '',
    weight: '',
    phone: '',
    email: '',
    career_start_year: '',
    injury_illness_history: '',
    top_achievements: ['', '', ''],
    father_name: '',
    mother_name: '',
    parent_address: '',
    father_phone: '',
    mother_phone: '',
    is_active: true
  };
}

export function mapAthleteToForm(athlete) {
  const phoneValues = {
    phone: normalizeIndonesianMobile(athlete.phone) ?? athlete.phone ?? '',
    father_phone: normalizeIndonesianMobile(athlete.father_phone) ?? athlete.father_phone ?? '',
    mother_phone: normalizeIndonesianMobile(athlete.mother_phone) ?? athlete.mother_phone ?? ''
  };
  const birthDate = formatDateForInput(athlete.birth_date);
  const ageGroup = getAthleteAgeGroup(birthDate);
  const identityType = isIdentityTypeValidForAge(athlete.identity_document_type, ageGroup)
    ? athlete.identity_document_type
    : '';

  return {
    formData: {
      cabor_id: athlete.cabor_id?.toString() || '',
      organization_id: athlete.organization_id?.toString() || '',
      education_level_id: athlete.education_level_id?.toString() || '',
      competition_class_id: athlete.competition_class_id?.toString() || '',
      name: athlete.name || '',
      nik: athlete.nik || '',
      national_athlete_number: athlete.national_athlete_number || '',
      no_kk: athlete.no_kk || '',
      birth_place: athlete.birth_place || '',
      birth_date: birthDate,
      gender: athlete.gender || '',
      identity_document_type: identityType,
      religion: athlete.religion || '',
      address: athlete.address || '',
      province: athlete.province || '',
      city: athlete.city || '',
      district: athlete.district || '',
      village: athlete.village || '',
      blood_type: athlete.blood_type || '',
      occupation: athlete.occupation || '',
      marital_status: athlete.marital_status || '',
      hobby: athlete.hobby || '',
      height: athlete.height || '',
      weight: athlete.weight || '',
      phone: phoneValues.phone,
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
      father_phone: phoneValues.father_phone,
      mother_phone: phoneValues.mother_phone,
      is_active: athlete.is_active ?? true
    },
    phoneValues,
    ageGroup
  };
}

export function getDocumentValidationErrors({
  formData,
  athlete,
  identityDocumentFile,
  documentErrors
}) {
  const validationErrors = {};
  const ageGroup = getAthleteAgeGroup(formData.birth_date);
  const storedIdentityType = athlete?.identity_document_type || '';
  const canReuseStoredIdentity = Boolean(athlete?.identity_document) &&
    isIdentityTypeValidForAge(storedIdentityType, ageGroup) &&
    formData.identity_document_type === storedIdentityType;

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
  if (documentErrors.identity) {
    validationErrors.identity_document = [documentErrors.identity];
  }
  if (documentErrors.bpjs) {
    validationErrors.bpjs_document = [documentErrors.bpjs];
  }
  return validationErrors;
}

export function buildAthleteFormData(submissionData, files, { excludedFields = [], includeEmptyFields = false } = {}) {
  const data = new FormData();
  const excluded = new Set(excludedFields);
  Object.entries(submissionData).forEach(([key, value]) => {
    if (excluded.has(key)) return;
    if (key === 'top_achievements') {
      const filtered = value.filter((item) => item && item.trim() !== '');
      data.append(key, JSON.stringify(filtered.length > 0 ? filtered : []));
    } else if (key === 'is_active') {
      data.append(key, value ? '1' : '0');
    } else if (includeEmptyFields || (value !== '' && value !== null && value !== undefined)) {
      data.append(key, value ?? '');
    }
  });
  if (files.photoFile) data.append('photo', files.photoFile);
  if (files.identityDocumentFile) data.append('identity_document', files.identityDocumentFile);
  if (files.bpjsDocumentFile) data.append('bpjs_document', files.bpjsDocumentFile);
  return data;
}

export function getAthleteErrorStep(errorFields) {
  const step1Fields = ['name', 'nik', 'no_kk', 'birth_place', 'birth_date', 'gender', 'religion', 'cabor_id', 'competition_class', 'address', 'province', 'city', 'district', 'village', 'identity_document_type', 'identity_document', 'bpjs_document'];
  const step2Fields = ['height', 'weight', 'blood_type', 'education_level_id', 'occupation', 'marital_status', 'phone', 'email'];
  const step4Fields = ['father_name', 'mother_name', 'parent_address', 'father_phone', 'mother_phone'];
  if (errorFields.some((field) => step1Fields.includes(field))) return 1;
  if (errorFields.some((field) => step2Fields.includes(field))) return 2;
  if (errorFields.some((field) => step4Fields.includes(field))) return 4;
  return 3;
}
