import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Loader from './Loader';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPath, normalizeRole } from '../../utils/authUtils';

export default function ProtectedRoute({ allowedRoles, publicOnly = false }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader />;

  if (publicOnly && user && profile?.profileComplete === false) {
    return <Navigate to="/complete-profile" replace />;
  }

  const role = normalizeRole(profile?.role);

  if (publicOnly && user && profile?.role) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  if (publicOnly) return <Outlet />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!profile?.role) {
    return <Navigate to="/complete-profile" replace state={{ from: location }} />;
  }

  if (profile.profileComplete === false) {
    return <Navigate to="/complete-profile" replace state={{ from: location }} />;
  }

  if (profile.status === 'disabled') {
    return (
      <div className="app-canvas grid min-h-screen place-items-center px-4">
        <div className="glass-card max-w-lg rounded-3xl p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-200">
            Account disabled
          </p>
          <h1 className="mt-3 text-3xl font-black text-white">
            Access paused
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Your account has been disabled. Please contact admin.
          </p>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return <Outlet />;
}
