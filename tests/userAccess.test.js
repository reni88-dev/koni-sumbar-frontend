import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_USER_ACCESS_MESSAGE_LABEL,
  getUserDisabledMessageLabel,
  isUserAccessEnabled,
} from '../src/lib/userAccess.js';

test('user access defaults to enabled for backward-compatible payloads', () => {
  assert.equal(isUserAccessEnabled({}), true);
  assert.equal(isUserAccessEnabled({ access_enabled: true }), true);
  assert.equal(isUserAccessEnabled({ access_enabled: false }), false);
});

test('disabled user message trims custom text and labels empty text as system default', () => {
  assert.equal(getUserDisabledMessageLabel({ access_disabled_message: '  Verifikasi akun.  ' }), 'Verifikasi akun.');
  assert.equal(getUserDisabledMessageLabel({ access_disabled_message: '   ' }), DEFAULT_USER_ACCESS_MESSAGE_LABEL);
});
