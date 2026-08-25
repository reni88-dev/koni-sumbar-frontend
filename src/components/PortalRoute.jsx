import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function PortalRoute({ role, children }) {
  const { user } = useAuth();

  if (user?.role?.name !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}