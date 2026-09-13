import { AccountBlockedDialog } from './AccountBlockedDialog';
import { ACCESS_CODES } from '../lib/authAccess';

export function RoleAccessDisabledDialog({ message, onReturnToLogin }) {
  return (
    <AccountBlockedDialog
      block={message ? {
        code: ACCESS_CODES.ROLE_ACCESS_DISABLED,
        title: 'Akses Role Dinonaktifkan',
        message,
      } : null}
      onReturnToLogin={onReturnToLogin}
    />
  );
}
