import assert from 'node:assert/strict';
import test from 'node:test';

import { validateAthleteProfile } from '../src/components/athlete-form/athleteProfileValidation.js';
import { validateCoachProfile } from '../src/components/coach-form/coachProfileValidation.js';
import {
  getBPJSRequirements,
  getInitialBPJSDeferredAcknowledgement,
  getInitialBPJSNumber,
  nextBPJSDeferredAcknowledgement,
  serializeBPJSDeferredAcknowledgement,
} from '../src/components/form-validation/bpjsValidation.js';
import {
  BPJS_REMINDER_SESSION_KEY,
  clearBPJSReminderSession,
  hasShownBPJSReminder,
  markBPJSReminderShown,
} from '../src/lib/bpjsReminderSession.js';

function validateBPJS(validateProfile, options = {}) {
  const requirements = getBPJSRequirements({
    ...options,
    bpjsNumber: options.bpjsNumber || '',
  });
  const errors = validateProfile({ bpjs_number: options.bpjsNumber || '' }, {
    bpjsNumberRequired: requirements.numberRequired,
    bpjsDocumentRequired: requirements.documentRequired,
    bpjsDeferredAcknowledgementRequired: requirements.deferredAcknowledgementRequired,
    bpjsDeferredAcknowledged: options.deferredAcknowledged,
  });
  return { errors, requirements };
}

const athletePortalOptions = {
  mode: 'portal',
  useAdminRules: true,
  requireMatchingPair: true,
};

test('atlet: nomor dan dokumen kosong wajib memakai pernyataan penundaan', () => {
  const { errors, requirements } = validateBPJS(validateAthleteProfile, athletePortalOptions);

  assert.equal(requirements.documentRequired, false);
  assert.equal(requirements.numberRequired, false);
  assert.equal(requirements.deferredAcknowledgementRequired, true);
  assert.deepEqual(errors.bpjs_deferred_acknowledged, [
    'Pernyataan penundaan dokumen BPJS wajib dicentang',
  ]);
  assert.equal(Object.hasOwn(errors, 'bpjs_number'), false);
  assert.equal(Object.hasOwn(errors, 'bpjs_document'), false);
});

test('atlet: pernyataan penundaan menerima nomor dan dokumen yang sama-sama kosong', () => {
  const { errors, requirements } = validateBPJS(validateAthleteProfile, {
    ...athletePortalOptions,
    deferredAcknowledged: true,
  });

  assert.equal(requirements.deferredAcknowledgementValid, true);
  assert.equal(Object.hasOwn(errors, 'bpjs_deferred_acknowledged'), false);
  assert.equal(Object.hasOwn(errors, 'bpjs_number'), false);
  assert.equal(Object.hasOwn(errors, 'bpjs_document'), false);
});

test('atlet: nomor tanpa dokumen ditolak sebagai state BPJS parsial', () => {
  const { errors, requirements } = validateBPJS(validateAthleteProfile, {
    ...athletePortalOptions,
    bpjsNumber: '0001234567890',
    deferredAcknowledged: true,
  });

  assert.equal(requirements.documentRequired, true);
  assert.equal(requirements.deferredAcknowledgementRequired, false);
  assert.deepEqual(errors.bpjs_document, [
    'Dokumen BPJS wajib diunggah ketika nomor BPJS diisi',
  ]);
  assert.equal(Object.hasOwn(errors, 'bpjs_deferred_acknowledged'), false);
});

test('atlet: dokumen tanpa nomor ditolak sebagai state BPJS parsial', () => {
  const { errors, requirements } = validateBPJS(validateAthleteProfile, {
    ...athletePortalOptions,
    bpjsDocumentFile: { name: 'bpjs.pdf' },
  });

  assert.equal(requirements.numberRequired, true);
  assert.equal(requirements.deferredAcknowledgementRequired, false);
  assert.deepEqual(errors.bpjs_number, [
    'Nomor BPJS wajib diisi ketika dokumen BPJS tersedia',
  ]);
  assert.equal(Object.hasOwn(errors, 'bpjs_deferred_acknowledged'), false);
});

test('atlet: dokumen tersimpan tanpa nomor tetap mewajibkan nomor BPJS', () => {
  const { errors, requirements } = validateBPJS(validateAthleteProfile, {
    ...athletePortalOptions,
    storedBPJSDocument: '/documents/bpjs-lama.pdf',
    deferredAcknowledged: true,
  });

  assert.equal(requirements.numberRequired, true);
  assert.equal(requirements.documentRequired, false);
  assert.equal(requirements.deferredAcknowledgementRequired, false);
  assert.deepEqual(errors.bpjs_number, [
    'Nomor BPJS wajib diisi ketika dokumen BPJS tersedia',
  ]);
});

test('atlet: nomor dan dokumen lengkap tidak memerlukan pernyataan', () => {
  const { errors, requirements } = validateBPJS(validateAthleteProfile, {
    ...athletePortalOptions,
    bpjsNumber: '0001234567890',
    storedBPJSDocument: '/documents/bpjs.pdf',
    deferredAcknowledged: true,
  });

  assert.equal(requirements.numberRequired, true);
  assert.equal(requirements.documentRequired, false);
  assert.equal(requirements.deferredAcknowledgementRequired, false);
  assert.equal(Object.hasOwn(errors, 'bpjs_number'), false);
  assert.equal(Object.hasOwn(errors, 'bpjs_document'), false);
  assert.equal(Object.hasOwn(errors, 'bpjs_deferred_acknowledged'), false);
});

test('Portal Pelatih tetap tidak mengaktifkan aturan BPJS admin', () => {
  const { errors, requirements } = validateBPJS(validateCoachProfile, {
    mode: 'portal',
    requireMatchingPair: true,
    bpjsNumber: '0001234567890',
  });

  assert.equal(requirements.numberRequired, false);
  assert.equal(requirements.documentRequired, false);
  assert.equal(requirements.deferredAcknowledgementRequired, false);
  assert.equal(Object.hasOwn(errors, 'bpjs_number'), false);
  assert.equal(Object.hasOwn(errors, 'bpjs_document'), false);
  assert.equal(Object.hasOwn(errors, 'bpjs_deferred_acknowledgement'), false);
});

test('atlet: nilai awal nomor BPJS dimuat dari profil', () => {
  assert.equal(getInitialBPJSNumber({
    bpjs_number: '0001234567890',
  }), '0001234567890');
});

test('atlet: state edit menginisialisasi pernyataan dari response backend', () => {
  assert.equal(getInitialBPJSDeferredAcknowledgement({
    bpjs_deferred_acknowledged: true,
  }), true);
  assert.equal(getInitialBPJSDeferredAcknowledgement({
    bpjs_deferred_acknowledged: false,
  }), false);
});

test('atlet: status pernyataan diserialisasi untuk multipart sebagai 1 atau 0', () => {
  assert.equal(serializeBPJSDeferredAcknowledgement(true), '1');
  assert.equal(serializeBPJSDeferredAcknowledgement(false), '0');
});

test('pelatih: perilaku penundaan lama tetap tidak mengubah persistence pelatih', () => {
  const missing = validateBPJS(validateCoachProfile, { mode: 'admin' });
  assert.deepEqual(missing.errors.bpjs_deferred_acknowledgement, [
    'Pernyataan penundaan dokumen BPJS wajib dicentang',
  ]);

  const deferred = validateBPJS(validateCoachProfile, {
    mode: 'admin',
    deferredAcknowledged: true,
  });
  assert.equal(Object.hasOwn(deferred.errors, 'bpjs_deferred_acknowledgement'), false);

  const documentOnly = validateBPJS(validateCoachProfile, {
    mode: 'admin',
    bpjsDocumentFile: { name: 'bpjs.pdf' },
  });
  assert.deepEqual(documentOnly.errors.bpjs_number, [
    'Nomor BPJS wajib diisi ketika dokumen BPJS tersedia',
  ]);
});

test('persetujuan penundaan direset saat memilih file, mengisi nomor, dan membuka ulang modal', () => {
  let acknowledged = nextBPJSDeferredAcknowledgement(false, 'acknowledge');
  assert.equal(acknowledged, true);

  acknowledged = nextBPJSDeferredAcknowledgement(acknowledged, 'file-selected');
  assert.equal(acknowledged, false);

  acknowledged = nextBPJSDeferredAcknowledgement(true, 'number-entered');
  assert.equal(acknowledged, false);

  acknowledged = nextBPJSDeferredAcknowledgement(true, 'reset');
  assert.equal(acknowledged, false);
});

test('helper sesi popup menandai, membaca, dan membersihkan pengingat', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };

  assert.equal(hasShownBPJSReminder(storage), false);
  markBPJSReminderShown(storage);
  assert.equal(values.get(BPJS_REMINDER_SESSION_KEY), '1');
  assert.equal(hasShownBPJSReminder(storage), true);
  clearBPJSReminderSession(storage);
  assert.equal(hasShownBPJSReminder(storage), false);
});
