import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

function ProtectedRoute({ allowedRoles }) {
  const { isReady, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="content-shell flex min-h-screen items-center justify-center">
        <div className="glass-panel w-full max-w-md p-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Loading session</p>
          <h1 className="mt-4 font-display text-3xl text-brand-ink">Preparing your workspace</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    const fallbackRoute = user.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard";
    return <Navigate to={fallbackRoute} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
