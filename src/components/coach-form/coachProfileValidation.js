import {
  normalizeProfilePhone,
  PROFILE_EMAIL_PATTERN,
  PROFILE_IDENTITY_PATTERN,
} from '../form-validation/profileValidation.js';

export const COACH_IDENTITY_PATTERN = PROFILE_IDENTITY_PATTERN;
export const COACH_EMAIL_PATTERN = PROFILE_EMAIL_PATTERN;
const target = (name) => `[data-field="${name}"]`;

export const COACH_PROFILE_FIELDS = [
  { name: 'photo', label: 'Foto Pelatih', step: 1, target: target('photo') },
  { name: 'name', label: 'Nama Lengkap', step: 1, target: target('name') },
  { name: 'nik', label: 'NIK', step: 1, target: target('nik') },
  { name: 'birth_place', label: 'Tempat Lahir', step: 1, target: target('birth_place') },
  { name: 'birth_date', label: 'Tanggal Lahir', step: 1, target: target('birth_date') },
  { name: 'gender', label: 'Jenis Kelamin', step: 1, target: target('gender') },
  { name: 'religion', label: 'Agama', step: 1, target: target('religion') },
  { name: 'identity_document', label: 'KTP Pelatih', step: 1, target: target('identity_document') },
  { name: 'bpjs_document', label: 'Dokumen BPJS', step: 1, target: target('bpjs_document') },
  { name: 'cabor_id', label: 'Cabang Olahraga', step: 1, target: target('cabor_id') },
  { name: 'organization_id', label: 'Organisasi/Pengcab', step: 1, target: target('organization_id') },
  { name: 'address', label: 'Alamat Domisili', step: 1, target: target('address') },
  { name: 'province', label: 'Provinsi', step: 1, target: target('province') },
  { name: 'city', label: 'Kota/Kabupaten', step: 1, target: target('city') },
  { name: 'district', label: 'Kecamatan/Distrik', step: 1, target: target('district') },
  { name: 'village', label: 'Kelurahan/Desa', step: 1, target: target('village') },
  { name: 'phone', label: 'Nomor WhatsApp', step: 2, target: target('phone') },
  { name: 'email', label: 'Email', step: 2, target: target('email') },
  { name: 'license_number', label: 'Nomor Lisensi', step: 3, target: target('license_number') },
  { name: 'license_level', label: 'Tingkat Lisensi', step: 3, target: target('license_level') },
  { name: 'coaching_start_year', label: 'Tahun Mulai Melatih', step: 3, target: target('coaching_start_year') },
  { name: 'specialization', label: 'Spesialisasi', step: 3, target: target('specialization') },
  { name: 'certificate_document', label: 'Sertifikat Kepelatihan', step: 3, target: target('certificate_document') },
  { name: 'achievements', label: 'Prestasi Kepelatihan', step: 3, target: target('achievements') },
  { name: 'is_active', label: 'Status Keaktifan', step: 3, target: target('is_active') },
];

function isValidOptionalDate(value) {
  if (!value) return true;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) &&
    date.getMonth() === Number(match[2]) - 1 &&
    date.getDate() === Number(match[3]) &&
    date <= new Date();
}

export function validateCoachProfile(formData, context = {}) {
  const errors = {};
  const add = (field, message) => {
    if (!errors[field]) errors[field] = [message];
  };
  const text = (field) => String(formData[field] || '').trim();

  if (!text('name')) add('name', 'Nama lengkap wajib diisi');
  if (!COACH_IDENTITY_PATTERN.test(text('nik'))) {
    add('nik', text('nik') ? 'NIK harus tepat 16 digit angka' : 'NIK wajib diisi dengan 16 digit angka');
  }
  if (!text('cabor_id')) add('cabor_id', 'Cabang olahraga wajib dipilih');
  if (!text('province')) add('province', 'Provinsi wajib dipilih');
  if (!text('city')) add('city', 'Kota/Kabupaten wajib dipilih');
  if (!text('district')) add('district', 'Kecamatan/Distrik wajib dipilih');
  if (!context.identityDocumentFile && !context.canReuseStoredIdentity) {
    add(
      'identity_document',
      context.isEdit
        ? 'Data pelatih lama ini belum memiliki KTP. Unggah KTP sebelum menyimpan perubahan.'
        : 'KTP pelatih wajib diunggah.',
    );
  }
  if (context.documentErrors?.identity) {
    errors.identity_document = [context.documentErrors.identity];
  }
  if (context.documentErrors?.bpjs) {
    errors.bpjs_document = [context.documentErrors.bpjs];
  }

  if (text('birth_date') && !isValidOptionalDate(text('birth_date'))) {
    add('birth_date', 'Tanggal lahir harus valid dan tidak boleh di masa depan');
  }

  if (text('phone')) {
    const normalizedPhone = normalizeProfilePhone(formData.phone);
    if (!normalizedPhone) {
      add('phone', 'Format nomor WhatsApp tidak valid');
    } else if (context.phoneStatus && context.phoneStatus !== 'valid') {
      add('phone', context.phoneMessage || 'Nomor WhatsApp harus valid sebelum menyimpan data');
    }
  }
  if (text('email') && !COACH_EMAIL_PATTERN.test(text('email'))) {
    add('email', 'Format alamat email tidak valid');
  }
  if (context.certificateError) {
    errors.certificate_document = [context.certificateError];
  }

  return errors;
}
