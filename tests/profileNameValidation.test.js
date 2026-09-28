import assert from 'node:assert/strict';
import test from 'node:test';

import { validateAthleteProfile } from '../src/components/athlete-form/athleteProfileValidation.js';
import { validateCoachProfile } from '../src/components/coach-form/coachProfileValidation.js';
import {
  PROFILE_NAME_VALIDATION_MESSAGE,
  isProfileNameValid,
  sanitizeProfileNameInput,
} from '../src/components/form-validation/profileValidation.js';

test('input nama hanya mempertahankan huruf Unicode dan spasi', () => {
  assert.equal(sanitizeProfileNameInput('  \u00C9ka   Putri123@'), '\u00C9ka Putri');
  assert.equal(sanitizeProfileNameInput('Andi-Budi.2'), 'AndiBudi');
});

test('validator nama menerima huruf dan spasi serta menolak angka atau simbol', () => {
  assert.equal(isProfileNameValid('Muhammad Ali'), true);
  assert.equal(isProfileNameValid('\u00C9ka Putri'), true);
  assert.equal(isProfileNameValid('Atlet 123'), false);
  assert.equal(isProfileNameValid('Siti-Aisyah'), false);
  assert.equal(isProfileNameValid('Rina.P'), false);
});

test('form atlet dan pelatih memakai pesan validasi nama yang sama', () => {
  const athleteErrors = validateAthleteProfile({ name: 'Atlet 123' });
  const coachErrors = validateCoachProfile({ name: 'Pelatih@KONI' });

  assert.deepEqual(athleteErrors.name, [PROFILE_NAME_VALIDATION_MESSAGE]);
  assert.deepEqual(coachErrors.name, [PROFILE_NAME_VALIDATION_MESSAGE]);
});
