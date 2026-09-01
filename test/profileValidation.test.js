import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATHLETE_PROFILE_FIELDS,
  canReuseAthleteStoredIdentity,
  validateAthleteProfile,
} from '../src/components/athlete-form/athleteProfileValidation.js';
import {
  COACH_PROFILE_FIELDS,
  validateCoachProfile,
} from '../src/components/coach-form/coachProfileValidation.js';
import {
  filterValidationErrorsByStep,
  focusValidationField,
  getFieldMeta,
  getStepErrorCounts,
  orderedValidationEntries,
} from '../src/components/form-validation/profileValidation.js';

function completeAthlete() {
  return {
    name: 'Atlet Lengkap', nik: '1371010101010001', no_kk: '1371010101010002',
    birth_place: 'Padang', birth_date: '2000-01-01', gender: 'male', religion: 'Islam',
    address: 'Padang', province: 'Sumatera Barat', city: 'Kota Padang', district: 'Kuranji',
    village: 'Korong Gadang', identity_document_type: 'ktp', cabor_id: '1', organization_id: '2',
    height: '175', weight: '70', blood_type: 'O', education_level_id: '3', occupation: 'Atlet',
    marital_status: 'single', phone: '6281234567890', email: 'atlet@example.com',
    career_start_year: '2015', father_name: 'Ayah', mother_name: 'Ibu', parent_address: 'Padang',
    father_phone: '', mother_phone: '', national_athlete_number: '', competition_class_id: '',
    hobby: '', injury_illness_history: '', top_achievements: [], is_active: true,
  };
}

function completeCoach() {
  return {
    name: 'Pelatih Lengkap', nik: '1371010101010003', cabor_id: '1', organization_id: '',
    birth_place: '', birth_date: '', gender: '', religion: '', address: '',
    province: 'Sumatera Barat', city: 'Kota Padang', district: 'Kuranji', village: '',
    phone: '', email: '', license_number: '', license_level: '', coaching_start_year: '',
    specialization: '', is_active: true,
  };
}

test('validator atlet mengumpulkan seluruh error dalam urutan metadata yang stabil', () => {
  const errors = validateAthleteProfile({}, {});
  const entries = orderedValidationEntries(errors, ATHLETE_PROFILE_FIELDS);
  assert.ok(entries.length > 10);
  assert.deepEqual(entries.slice(0, 5).map((entry) => entry.field), [
    'name', 'nik', 'no_kk', 'birth_place', 'birth_date',
  ]);
  assert.ok(errors.identity_document);
  assert.ok(errors.email);
  assert.ok(errors.parent_address);
});

test('filter dan hitungan validasi per step mengikuti metadata form', () => {
  const errors = validateAthleteProfile({}, {});
  const stepTwo = filterValidationErrorsByStep(errors, ATHLETE_PROFILE_FIELDS, 2);
  assert.ok(stepTwo.height);
  assert.ok(stepTwo.email);
  assert.equal(stepTwo.name, undefined);
  const counts = getStepErrorCounts(errors, ATHLETE_PROFILE_FIELDS);
  assert.ok(counts[1] > 0);
  assert.ok(counts[2] > 0);
  assert.ok(counts[4] > 0);
});

test('metadata memetakan label, step, dan target fokus', () => {
  assert.deepEqual(getFieldMeta(ATHLETE_PROFILE_FIELDS, 'identity_document'), {
    name: 'identity_document',
    label: 'Dokumen Identitas',
    step: 1,
    target: '[data-field="identity_document"]',
  });
  assert.equal(getFieldMeta(COACH_PROFILE_FIELDS, 'email').step, 2);
});

test('field opsional atlet dan pelatih tidak dianggap error', () => {
  const athlete = completeAthlete();
  const athleteErrors = validateAthleteProfile(athlete, {
    athlete: { birth_date: athlete.birth_date, identity_document: 'stored.pdf', identity_document_type: 'ktp' },
    phoneStatus: 'valid', emailStatus: 'valid',
  });
  assert.deepEqual(athleteErrors, {});

  const coachErrors = validateCoachProfile(completeCoach(), {
    canReuseStoredIdentity: true,
    isEdit: true,
  });
  assert.deepEqual(coachErrors, {});
});

test('dokumen atlet lama tanpa tipe memerlukan konfirmasi tetapi tidak upload ulang', () => {
  const athlete = completeAthlete();
  athlete.identity_document_type = '';
  const record = { birth_date: athlete.birth_date, identity_document: 'legacy.pdf', identity_document_type: '' };
  let errors = validateAthleteProfile(athlete, {
    athlete: record,
    phoneStatus: 'valid', emailStatus: 'valid',
  });
  assert.ok(errors.identity_document_type);
  assert.equal(errors.identity_document, undefined);

  athlete.identity_document_type = 'ktp';
  assert.equal(canReuseAthleteStoredIdentity({ athlete: record, formData: athlete }), true);
  errors = validateAthleteProfile(athlete, {
    athlete: record,
    phoneStatus: 'valid', emailStatus: 'valid',
  });
  assert.equal(errors.identity_document_type, undefined);
  assert.equal(errors.identity_document, undefined);
});

test('perubahan kelompok umur atau tipe tersimpan mewajibkan dokumen pengganti', () => {
  const athlete = completeAthlete();
  const record = { birth_date: '2012-01-01', identity_document: 'family-card.pdf', identity_document_type: 'family_card' };
  assert.equal(canReuseAthleteStoredIdentity({ athlete: record, formData: athlete }), false);
  const errors = validateAthleteProfile(athlete, {
    athlete: record,
    phoneStatus: 'valid', emailStatus: 'valid',
  });
  assert.ok(errors.identity_document);
});

test('validator pelatih hanya mewajibkan field aktif dan KTP', () => {
  const errors = validateCoachProfile({}, { isEdit: false });
  assert.deepEqual(orderedValidationEntries(errors, COACH_PROFILE_FIELDS).map((entry) => entry.field), [
    'name', 'nik', 'identity_document', 'cabor_id', 'province', 'city', 'district',
  ]);
  assert.equal(errors.organization_id, undefined);
  assert.equal(errors.village, undefined);
  assert.equal(errors.email, undefined);
  assert.equal(errors.certificate_document, undefined);
});

test('error backend tak dikenal tetap berada di ringkasan setelah field dikenal', () => {
  const entries = orderedValidationEntries({
    nik: ['NIK tidak valid'],
    legacy_backend_field: ['Periksa data lama'],
  }, COACH_PROFILE_FIELDS);
  assert.equal(entries[0].field, 'nik');
  assert.equal(entries[1].field, 'legacy_backend_field');
  assert.equal(entries[1].known, false);
});
test('navigasi error backend tak dikenal berfokus ke ringkasan setelah render', async () => {
  let scrolled = false;
  let focused = false;
  const result = await focusValidationField({
    field: 'legacy_backend_field',
    metadata: COACH_PROFILE_FIELDS,
    rootRef: { current: null },
    summaryRef: {
      current: {
        scrollIntoView: () => { scrolled = true; },
        focus: () => { focused = true; },
      },
    },
  });

  assert.equal(result, false);
  assert.equal(scrolled, true);
  assert.equal(focused, true);
});
