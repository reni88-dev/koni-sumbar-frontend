import {
  normalizeProfilePhone,
  PROFILE_EMAIL_PATTERN,
  PROFILE_IDENTITY_PATTERN,
} from '../form-validation/profileValidation.js';

export const ATHLETE_IDENTITY_PATTERN = PROFILE_IDENTITY_PATTERN;
export const ATHLETE_EMAIL_PATTERN = PROFILE_EMAIL_PATTERN;

function parseDateInput(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').slice(0, 10));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function getAthleteAgeGroup(birthDateValue, today = new Date()) {
  const birthDate = parseDateInput(birthDateValue);
  if (!birthDate) return null;
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (birthDate > currentDate) return null;
  const seventeenthBirthday = new Date(
    birthDate.getFullYear() + 17,
    birthDate.getMonth(),
    birthDate.getDate(),
  );
  return currentDate >= seventeenthBirthday ? 'adult' : 'minor';
}

export function isIdentityTypeValidForAge(documentType, ageGroup) {
  return ageGroup === 'adult'
    ? documentType === 'ktp'
    : ageGroup === 'minor' && ['family_card', 'birth_certificate'].includes(documentType);
}
const target = (name) => `[data-field="${name}"]`;

export const ATHLETE_PROFILE_FIELDS = [
  { name: 'photo', label: 'Foto Atlet', step: 1, target: target('photo') },
  { name: 'name', label: 'Nama Lengkap', step: 1, target: target('name') },
  { name: 'nik', label: 'NIK', step: 1, target: target('nik') },
  { name: 'no_kk', label: 'Nomor Kartu Keluarga', step: 1, target: target('no_kk') },
  { name: 'national_athlete_number', label: 'Nomor Atlet Nasional', step: 1, target: target('national_athlete_number') },
  { name: 'birth_place', label: 'Tempat Lahir', step: 1, target: target('birth_place') },
  { name: 'birth_date', label: 'Tanggal Lahir', step: 1, target: target('birth_date') },
  { name: 'gender', label: 'Jenis Kelamin', step: 1, target: target('gender') },
  { name: 'religion', label: 'Agama', step: 1, target: target('religion') },
  { name: 'address', label: 'Alamat Domisili', step: 1, target: target('address') },
  { name: 'province', label: 'Provinsi', step: 1, target: target('province') },
  { name: 'city', label: 'Kota/Kabupaten', step: 1, target: target('city') },
  { name: 'district', label: 'Kecamatan/Distrik', step: 1, target: target('district') },
  { name: 'village', label: 'Kelurahan/Desa', step: 1, target: target('village') },
  { name: 'identity_document_type', label: 'Jenis Dokumen Identitas', step: 1, target: target('identity_document_type') },
  { name: 'identity_document', label: 'Dokumen Identitas', step: 1, target: target('identity_document') },
  { name: 'bpjs_document', label: 'Dokumen BPJS', step: 1, target: target('bpjs_document') },
  { name: 'cabor_id', label: 'Cabang Olahraga', step: 1, target: target('cabor_id') },
  { name: 'organization_id', label: 'Organisasi/Pengcab', step: 1, target: target('organization_id') },
  { name: 'competition_class_id', label: 'Kelas Pertandingan', step: 1, target: target('competition_class_id') },
  { name: 'competition_class', label: 'Kelas Pertandingan', step: 1, target: target('competition_class_id') },
  { name: 'height', label: 'Tinggi Badan', step: 2, target: target('height') },
  { name: 'weight', label: 'Berat Badan', step: 2, target: target('weight') },
  { name: 'blood_type', label: 'Golongan Darah', step: 2, target: target('blood_type') },
  { name: 'education_level_id', label: 'Pendidikan Terakhir', step: 2, target: target('education_level_id') },
  { name: 'occupation', label: 'Pekerjaan', step: 2, target: target('occupation') },
  { name: 'marital_status', label: 'Status Perkawinan', step: 2, target: target('marital_status') },
  { name: 'hobby', label: 'Hobi', step: 2, target: target('hobby') },
  { name: 'phone', label: 'Nomor WhatsApp', step: 2, target: target('phone') },
  { name: 'email', label: 'Email', step: 2, target: target('email') },
  { name: 'career_start_year', label: 'Tahun Mulai Karier', step: 3, target: target('career_start_year') },
  { name: 'is_active', label: 'Status Keaktifan', step: 3, target: target('is_active') },
  { name: 'top_achievements', label: 'Prestasi Terbaik', step: 3, target: target('top_achievements') },
  { name: 'injury_illness_history', label: 'Riwayat Cedera/Penyakit', step: 3, target: target('injury_illness_history') },
  { name: 'father_name', label: 'Nama Ayah/Wali', step: 4, target: target('father_name') },
  { name: 'mother_name', label: 'Nama Ibu/Wali', step: 4, target: target('mother_name') },
  { name: 'parent_address', label: 'Alamat Orang Tua/Wali', step: 4, target: target('parent_address') },
  { name: 'father_phone', label: 'WhatsApp Ayah/Wali', step: 4, target: target('father_phone') },
  { name: 'mother_phone', label: 'WhatsApp Ibu/Wali', step: 4, target: target('mother_phone') },
];

function hasStoredFile(value) {
  return Boolean(String(value || '').trim());
}

export function canReuseAthleteStoredIdentity({ athlete, formData }) {
  if (!hasStoredFile(athlete?.identity_document)) return false;

  const ageGroup = getAthleteAgeGroup(formData.birth_date);
  const originalAgeGroup = getAthleteAgeGroup(
    typeof athlete?.birth_date === 'string'
      ? athlete.birth_date.slice(0, 10)
      : athlete?.birth_date,
  );
  const selectedType = formData.identity_document_type;
  const storedType = String(athlete?.identity_document_type || '').trim();

  if (!ageGroup || !isIdentityTypeValidForAge(selectedType, ageGroup)) return false;
  if (originalAgeGroup && originalAgeGroup !== ageGroup) return false;
  if (storedType && storedType !== selectedType) return false;
  return true;
}

export function validateAthleteProfile(formData, context = {}) {
  const errors = {};
  const add = (field, message) => {
    if (!errors[field]) errors[field] = [message];
  };
  const text = (field) => String(formData[field] || '').trim();

  if (!text('name')) add('name', 'Nama lengkap wajib diisi');
  if (!ATHLETE_IDENTITY_PATTERN.test(text('nik'))) {
    add('nik', text('nik') ? 'NIK harus tepat 16 digit angka' : 'NIK wajib diisi dengan 16 digit angka');
  }
  if (!ATHLETE_IDENTITY_PATTERN.test(text('no_kk'))) {
    add('no_kk', text('no_kk') ? 'No. KK harus tepat 16 digit angka' : 'No. KK wajib diisi dengan 16 digit angka');
  }
  if (!text('birth_place')) add('birth_place', 'Tempat lahir wajib diisi');

  const ageGroup = getAthleteAgeGroup(formData.birth_date);
  if (!ageGroup) {
    add('birth_date', 'Tanggal lahir wajib valid dan tidak boleh di masa depan');
  }
  if (!text('gender')) add('gender', 'Jenis kelamin wajib dipilih');
  if (!text('religion')) add('religion', 'Agama wajib dipilih');
  if (!text('address')) add('address', 'Alamat domisili wajib diisi');
  if (!text('province')) add('province', 'Provinsi wajib dipilih');
  if (!text('city')) add('city', 'Kota/Kabupaten wajib dipilih');
  if (!text('district')) add('district', 'Kecamatan/Distrik wajib dipilih');
  if (!text('village')) add('village', 'Kelurahan/Desa wajib dipilih');

  if (ageGroup && !isIdentityTypeValidForAge(formData.identity_document_type, ageGroup)) {
    add(
      'identity_document_type',
      ageGroup === 'adult'
        ? 'Atlet berusia 17 tahun atau lebih wajib mengonfirmasi KTP'
        : 'Pilih KK atau Akte Kelahiran untuk atlet di bawah 17 tahun',
    );
  }

  const canReuseIdentity = canReuseAthleteStoredIdentity({
    athlete: context.athlete,
    formData,
  });
  const storedIdentityExists = hasStoredFile(context.athlete?.identity_document);
  const storedIdentityType = String(context.athlete?.identity_document_type || '').trim();
  const originalAgeGroup = getAthleteAgeGroup(context.athlete?.birth_date);
  const awaitingLegacyTypeConfirmation = storedIdentityExists &&
    !storedIdentityType &&
    originalAgeGroup === ageGroup;
  if (!context.identityDocumentFile && !canReuseIdentity && !awaitingLegacyTypeConfirmation) {
    add(
      'identity_document',
      storedIdentityExists
        ? 'Dokumen identitas tersimpan tidak dapat digunakan untuk pilihan ini. Unggah dokumen pengganti.'
        : 'Dokumen identitas wajib diunggah',
    );
  }
  if (context.documentErrors?.identity) {
    errors.identity_document = [context.documentErrors.identity];
  }
  if (context.documentErrors?.bpjs) {
    errors.bpjs_document = [context.documentErrors.bpjs];
  }

  if (!text('cabor_id')) add('cabor_id', 'Cabang olahraga wajib dipilih');
  if (!text('organization_id')) add('organization_id', 'Organisasi/Pengcab wajib dipilih');
  if (!(Number(formData.height) > 0)) add('height', 'Tinggi badan wajib diisi');
  if (!(Number(formData.weight) > 0)) add('weight', 'Berat badan wajib diisi');
  if (!text('blood_type')) add('blood_type', 'Golongan darah wajib dipilih');
  if (!text('education_level_id')) add('education_level_id', 'Pendidikan terakhir wajib dipilih');
  if (!text('occupation')) add('occupation', 'Pekerjaan wajib diisi');
  if (!text('marital_status')) add('marital_status', 'Status perkawinan wajib dipilih');

  const normalizedPhone = normalizeProfilePhone(formData.phone);
  if (!text('phone')) {
    add('phone', 'Nomor WhatsApp wajib diisi');
  } else if (!normalizedPhone) {
    add('phone', 'Format nomor WhatsApp tidak valid');
  } else if (context.phoneStatus && context.phoneStatus !== 'valid') {
    add('phone', context.phoneMessage || 'Nomor WhatsApp harus valid sebelum menyimpan data');
  }

  if (!text('email')) {
    add('email', 'Email wajib diisi');
  } else if (!ATHLETE_EMAIL_PATTERN.test(text('email'))) {
    add('email', 'Format alamat email tidak valid');
  } else if (context.emailStatus && context.emailStatus !== 'valid') {
    add('email', context.emailMessage || 'Email harus berhasil diperiksa sebelum menyimpan data');
  }

  if (!(Number(formData.career_start_year) > 0)) {
    add('career_start_year', 'Tahun mulai karier wajib diisi');
  }
  if (!text('father_name')) add('father_name', 'Nama ayah/wali wajib diisi');
  if (!text('mother_name')) add('mother_name', 'Nama ibu/wali wajib diisi');
  if (!text('parent_address')) add('parent_address', 'Alamat orang tua/wali wajib diisi');

  for (const [field, statusField, messageField, label] of [
    ['father_phone', 'fatherPhoneStatus', 'fatherPhoneMessage', 'ayah/wali'],
    ['mother_phone', 'motherPhoneStatus', 'motherPhoneMessage', 'ibu/wali'],
  ]) {
    if (!text(field)) continue;
    const normalized = normalizeProfilePhone(formData[field]);
    if (!normalized) {
      add(field, 'Format nomor WhatsApp tidak valid');
    } else if (context[statusField] && context[statusField] !== 'valid') {
      add(field, context[messageField] || `Nomor WhatsApp ${label} harus valid sebelum menyimpan data`);
    }
  }

  return errors;
}
