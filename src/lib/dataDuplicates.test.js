import test from 'node:test';
import assert from 'node:assert/strict';
import {
  duplicateDeleteConfirmation,
  duplicateLoginRecommendation,
  isGuidedDuplicateResolution,
} from './dataDuplicates.js';

function candidate(overrides = {}) {
  return {
    entity: 'athlete',
    review: { status: 'same_person', stale: false },
    record_a: {
      entity_type: 'athlete',
      id: 1,
      account: { linked: true, has_logged_in: true, must_reset_password: true },
    },
    record_b: {
      entity_type: 'athlete',
      id: 2,
      account: { linked: true, has_logged_in: false, must_reset_password: false },
    },
    ...overrides,
  };
}

test('recommends keeping the only account that has logged in', () => {
  assert.deepEqual(duplicateLoginRecommendation(candidate()), {
    keepKey: 'athlete:1',
    deleteKey: 'athlete:2',
  });
});

test('does not use password reset status as a login tie-breaker', () => {
  const value = candidate();
  value.record_a.account.has_logged_in = false;
  assert.equal(duplicateLoginRecommendation(value), null);
});

test('does not recommend when both login states match or an account is unavailable', () => {
  const bothLoggedIn = candidate();
  bothLoggedIn.record_b.account.has_logged_in = true;
  assert.equal(duplicateLoginRecommendation(bothLoggedIn), null);

  const missingAccount = candidate();
  missingAccount.record_b.account.linked = false;
  assert.equal(duplicateLoginRecommendation(missingAccount), null);
});

test('only reviewed, fresh, same-entity duplicates enter guided resolution', () => {
  assert.equal(isGuidedDuplicateResolution(candidate()), true);
  assert.equal(isGuidedDuplicateResolution(candidate({ review: { status: 'unreviewed', stale: false } })), false);
  assert.equal(isGuidedDuplicateResolution(candidate({ review: { status: 'same_person', stale: true } })), false);
  assert.equal(isGuidedDuplicateResolution(candidate({ review: { status: 'different_person', stale: false } })), false);
  assert.equal(isGuidedDuplicateResolution(candidate({ entity: 'dual_role' })), false);
});

test('builds the required destructive confirmation text', () => {
  assert.equal(duplicateDeleteConfirmation({ entity_type: 'athlete', id: 12 }), 'HAPUS ATLET #12');
  assert.equal(duplicateDeleteConfirmation({ entity_type: 'coach', id: 9 }), 'HAPUS PELATIH #9');
});
