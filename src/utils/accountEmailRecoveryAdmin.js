const approvalBlockCodes = new Set([
  'ACCOUNT_RECOVERY_ACCOUNT_ALREADY_ACTIVE',
  'ACCOUNT_RECOVERY_EMAIL_IN_USE',
  'ACCOUNT_RECOVERY_ACCOUNT_CHANGED',
  'ACCOUNT_RECOVERY_ACCOUNT_UNAVAILABLE',
]);

const fallbackApprovalBlockMessage = 'Permintaan ini tidak dapat disetujui. Muat ulang detail atau tolak permintaan.';

export function getAccountRecoveryApprovalUI(detail, actionPending = false) {
  const blocked = detail?.status === 'pending_admin' && detail?.approval_allowed === false;
  const blockMessage = blocked
    ? detail.approval_block_message || fallbackApprovalBlockMessage
    : '';

  return {
    showWarning: blocked,
    approvalDisabled: Boolean(actionPending || blocked),
    rejectDisabled: Boolean(actionPending),
    canOpenApproval: !blocked,
    approvalTooltip: blocked ? blockMessage : undefined,
    blockMessage,
  };
}

export function accountRecoveryErrorMessage(error) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || 'Permintaan tidak dapat diproses.';
}

export function isAccountRecoveryApprovalBlockError(error) {
  return approvalBlockCodes.has(error?.response?.data?.code);
}