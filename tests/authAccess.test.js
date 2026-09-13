import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ACCESS_CODES,
  ROLE_ACCESS_DISABLED_MESSAGE,
  getAccountBlock,
  persistAccountBlock,
} from '../src/lib/authAccess.js';

test('disabled role account block uses neutral title and API message', () => {
  const block = getAccountBlock({
    code: ACCESS_CODES.ROLE_ACCESS_DISABLED,
    message: 'Maintenance sampai pukul 18.00 WIB.',
  });

  assert.equal(block.title, 'Akses Role Dinonaktifkan');
  assert.equal(block.message, 'Maintenance sampai pukul 18.00 WIB.');
});

test('disabled role account block uses system fallback when API message is empty', () => {
  const block = getAccountBlock({ code: ACCESS_CODES.ROLE_ACCESS_DISABLED, message: '' });

  assert.equal(block.title, 'Akses Role Dinonaktifkan');
  assert.equal(block.message, ROLE_ACCESS_DISABLED_MESSAGE);
});

test('failed login account block is persisted for the global dialog', () => {
  const stored = new Map();
  const storage = {
    setItem: (key, value) => stored.set(key, value),
  };

  const block = persistAccountBlock({
    code: ACCESS_CODES.ROLE_ACCESS_DISABLED,
    message: 'Akses ditutup selama maintenance.',
  }, storage);

  assert.equal(block.title, 'Akses Role Dinonaktifkan');
  assert.equal(block.message, 'Akses ditutup selama maintenance.');
  assert.deepEqual(JSON.parse(stored.get('auth:account-blocked')), block);
});

test('Axios 403 uses the backend role message instead of the generic request error', () => {
  const block = getAccountBlock({
    message: 'Request failed with status code 403',
    response: {
      status: 403,
      data: {
        code: ACCESS_CODES.ROLE_ACCESS_DISABLED,
        message: 'Sistem maintenance sampai pukul 18.00 WIB.',
      },
    },
  });

  assert.equal(block.title, 'Akses Role Dinonaktifkan');
  assert.equal(block.message, 'Sistem maintenance sampai pukul 18.00 WIB.');
});
