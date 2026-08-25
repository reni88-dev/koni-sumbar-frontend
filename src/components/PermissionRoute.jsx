import { ArrowLeft, LayoutDashboard, ShieldX } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { useAuth } from '../hooks/useAuth';

function hasPermission(user, required) {
  const permissions = user?.permissions || [];
  return permissions.includes('*') || permissions.includes(required);
}

export function PermissionRoute({ permission, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (permission && !hasPermission(user, permission)) {
    return <AccessDenied />;
  }
  return children;
}

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <ShieldX className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Akses Ditolak</h1>
        <p className="mb-7 max-w-md text-sm leading-6 text-slate-500">
          Anda tidak memiliki izin untuk melihat data atlet. Hubungi administrator jika akses ini diperlukan.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard', { replace: true })}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700"
          >
            <LayoutDashboard className="h-4 w-4" />
            Ke Dashboard
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
