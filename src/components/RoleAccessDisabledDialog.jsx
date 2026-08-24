import { AccountBlockedDialog } from './AccountBlockedDialog';
import { ACCESS_CODES } from '../lib/authAccess';

export function RoleAccessDisabledDialog({ message, onReturnToLogin }) {
  return (
    <AccountBlockedDialog
      block={message ? {
        code: ACCESS_CODES.ROLE_ACCESS_DISABLED,
        title: 'Akses Dinonaktifkan Sementara',
        message,
      } : null}
      onReturnToLogin={onReturnToLogin}
    />
  );
}
