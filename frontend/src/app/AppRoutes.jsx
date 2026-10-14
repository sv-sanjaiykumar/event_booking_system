import { Navigate, Route, Routes } from "react-router-dom";

import DiscoveryPage from "./App.jsx";
import AttendeeDashboard from "../features/bookings/AttendeeDashboard.jsx";
import CreatorDashboard from "../features/events/CreatorDashboard.jsx";
import CreateEventPage from "../features/events/CreateEventPage.jsx";
import EventDetailsPage from "../features/events/EventDetailsPage.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import NotFoundPage from "../features/auth/NotFoundPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";
import { RoleRoute, dashboardForRole } from "../features/auth/RoleRoute.jsx";
import { useAuth } from "../features/auth/useAuth.js";

function DashboardRedirect() {
  const { user, isInitializing } = useAuth();
  if (isInitializing) {
    return <main className="auth-loading">Checking your session…</main>;
  }
  return user
    ? <Navigate to={dashboardForRole(user.role)} replace />
    : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DiscoveryPage />} />
      <Route path="/events/:eventId" element={<EventDetailsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<RoleRoute role="attendee" />}>
        <Route path="/attendee/dashboard" element={<AttendeeDashboard />} />
      </Route>
      <Route element={<RoleRoute role="creator" />}>
        <Route path="/creator/dashboard" element={<CreatorDashboard />} />
        <Route path="/creator/events/new" element={<CreateEventPage />} />
      </Route>
      <Route path="/dashboard" element={<DashboardRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
