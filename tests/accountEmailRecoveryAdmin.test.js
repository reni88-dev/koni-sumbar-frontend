import test from 'node:test';
import assert from 'node:assert/strict';
import {
  accountRecoveryErrorMessage,
  getAccountRecoveryApprovalUI,
  isAccountRecoveryApprovalBlockError,
} from '../src/utils/accountEmailRecoveryAdmin.js';

test('blocked pending recovery shows warning, disables approval, and leaves rejection enabled', () => {
  const message = 'Akun sudah aktif.';
  const state = getAccountRecoveryApprovalUI({
    status: 'pending_admin',
    approval_allowed: false,
    approval_block_message: message,
  });

  assert.equal(state.showWarning, true);
  assert.equal(state.approvalDisabled, true);
  assert.equal(state.rejectDisabled, false);
  assert.equal(state.canOpenApproval, false);
  assert.equal(state.approvalTooltip, message);
  assert.equal(state.blockMessage, message);
});

test('eligible pending recovery can open approval and action pending disables both buttons', () => {
  const eligible = getAccountRecoveryApprovalUI({
    status: 'pending_admin',
    approval_allowed: true,
  });
  assert.equal(eligible.showWarning, false);
  assert.equal(eligible.approvalDisabled, false);
  assert.equal(eligible.rejectDisabled, false);
  assert.equal(eligible.canOpenApproval, true);

  const pending = getAccountRecoveryApprovalUI({
    status: 'pending_admin',
    approval_allowed: true,
  }, true);
  assert.equal(pending.approvalDisabled, true);
  assert.equal(pending.rejectDisabled, true);
});

test('approval conflict codes trigger detail refetch handling', () => {
  for (const code of [
    'ACCOUNT_RECOVERY_ACCOUNT_ALREADY_ACTIVE',
    'ACCOUNT_RECOVERY_EMAIL_IN_USE',
    'ACCOUNT_RECOVERY_ACCOUNT_CHANGED',
    'ACCOUNT_RECOVERY_ACCOUNT_UNAVAILABLE',
  ]) {
    assert.equal(isAccountRecoveryApprovalBlockError({ response: { data: { code } } }), true, code);
  }
  assert.equal(isAccountRecoveryApprovalBlockError({ response: { data: { code: 'OTHER_ERROR' } } }), false);
  assert.equal(isAccountRecoveryApprovalBlockError(new Error('network failure')), false);
});

test('backend-specific approval message is preserved for the admin', () => {
  const message = 'Permintaan tidak dapat disetujui karena akun ini sudah aktif.';
  assert.equal(accountRecoveryErrorMessage({ response: { data: { message } } }), message);
  assert.equal(accountRecoveryErrorMessage({ response: { data: { error: 'Fallback error' } } }), 'Fallback error');
  assert.equal(accountRecoveryErrorMessage(new Error('network failure')), 'Permintaan tidak dapat diproses.');
});