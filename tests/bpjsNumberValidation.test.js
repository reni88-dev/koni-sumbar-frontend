import assert from 'node:assert/strict';
import test from 'node:test';

import { validateAthleteProfile } from '../src/components/athlete-form/athleteProfileValidation.js';
import { validateCoachProfile } from '../src/components/coach-form/coachProfileValidation.js';
import {
  getBPJSRequirements,
  nextBPJSDeferredAcknowledgement,
} from '../src/components/form-validation/bpjsValidation.js';
import {
  BPJS_REMINDER_SESSION_KEY,
  clearBPJSReminderSession,
  hasShownBPJSReminder,
  markBPJSReminderShown,
} from '../src/lib/bpjsReminderSession.js';

const validators = [
  ['atlet', validateAthleteProfile],
  ['pelatih', validateCoachProfile],
];

function validateBPJS(validateProfile, options = {}) {
  const requirements = getBPJSRequirements(options);
  const errors = validateProfile({ bpjs_number: options.bpjsNumber || '' }, {
    bpjsNumberRequired: requirements.numberRequired,
    bpjsDeferredAcknowledgementRequired: requirements.deferredAcknowledgementRequired,
    bpjsDeferredAcknowledged: options.deferredAcknowledged,
  });
  return { errors, requirements };
}

for (const [subject, validateProfile] of validators) {
  test(`${subject}: tanpa dokumen dan belum centang menghasilkan error penundaan`, () => {
    const { errors, requirements } = validateBPJS(validateProfile, { mode: 'admin' });

    assert.equal(requirements.numberRequired, false);
    assert.equal(requirements.deferredAcknowledgementRequired, true);
    assert.deepEqual(errors.bpjs_deferred_acknowledgement, [
      'Pernyataan penundaan dokumen BPJS wajib dicentang',
    ]);
    assert.equal(Object.hasOwn(errors, 'bpjs_number'), false);
  });

  test(`${subject}: centang penundaan menghapus error ketika dokumen belum tersedia`, () => {
    const { errors, requirements } = validateBPJS(validateProfile, {
      mode: 'admin',
      deferredAcknowledged: true,
    });

    assert.equal(requirements.deferredAcknowledgementValid, true);
    assert.equal(Object.hasOwn(errors, 'bpjs_deferred_acknowledgement'), false);
    assert.equal(Object.hasOwn(errors, 'bpjs_number'), false);
  });

  test(`${subject}: file BPJS baru tidak memerlukan centang tetapi mewajibkan nomor`, () => {
    const { errors, requirements } = validateBPJS(validateProfile, {
      mode: 'admin',
      bpjsDocumentFile: { name: 'bpjs.pdf' },
    });

    assert.equal(requirements.deferredAcknowledgementRequired, false);
    assert.equal(requirements.numberRequired, true);
    assert.equal(Object.hasOwn(errors, 'bpjs_deferred_acknowledgement'), false);
    assert.deepEqual(errors.bpjs_number, [
      'Nomor BPJS wajib diisi ketika dokumen BPJS tersedia',
    ]);
  });

  test(`${subject}: dokumen BPJS tersimpan tetap mewajibkan nomor`, () => {
    const { errors, requirements } = validateBPJS(validateProfile, {
      mode: 'admin',
      storedBPJSDocument: '/documents/bpjs.pdf',
    });

    assert.equal(requirements.numberRequired, true);
    assert.equal(requirements.deferredAcknowledgementRequired, false);
    assert.ok(errors.bpjs_number);
    assert.equal(Object.hasOwn(errors, 'bpjs_deferred_acknowledgement'), false);
  });

  test(`${subject}: dokumen BPJS tersimpan tidak memerlukan centang dan menerima nomor lengkap`, () => {
    const { errors, requirements } = validateBPJS(validateProfile, {
      mode: 'admin',
      storedBPJSDocument: '/documents/bpjs.pdf',
      bpjsNumber: '0001234567890',
    });

    assert.equal(requirements.numberRequired, true);
    assert.equal(requirements.deferredAcknowledgementRequired, false);
    assert.equal(Object.hasOwn(errors, 'bpjs_number'), false);
    assert.equal(Object.hasOwn(errors, 'bpjs_deferred_acknowledgement'), false);
  });

  test(`${subject}: mode portal tidak menerapkan centang atau nomor khusus admin`, () => {
    const { errors, requirements } = validateBPJS(validateProfile, { mode: 'portal' });

    assert.equal(requirements.numberRequired, false);
    assert.equal(requirements.deferredAcknowledgementRequired, false);
    assert.equal(Object.hasOwn(errors, 'bpjs_number'), false);
    assert.equal(Object.hasOwn(errors, 'bpjs_deferred_acknowledgement'), false);
  });
}

test('persetujuan penundaan direset saat memilih file dan saat modal dibuka ulang', () => {
  let acknowledged = nextBPJSDeferredAcknowledgement(false, 'acknowledge');
  assert.equal(acknowledged, true);

  acknowledged = nextBPJSDeferredAcknowledgement(acknowledged, 'file-selected');
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
