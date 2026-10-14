import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./useAuth.js";

export function dashboardForRole(role) {
  return role === "creator" ? "/creator/dashboard" : "/attendee/dashboard";
}

export function RoleRoute({ role }) {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <main className="auth-loading" aria-live="polite">
        <span className="live-indicator__dot live-indicator__dot--syncing" />
        Checking your session…
      </main>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (role && user.role !== role) {
    return <Navigate to={dashboardForRole(user.role)} replace />;
  }
  return <Outlet />;
}
