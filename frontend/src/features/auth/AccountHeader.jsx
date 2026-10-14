import { Link, useNavigate } from "react-router-dom";

import BrandMark from "../../components/BrandMark.jsx";
import { dashboardForRole } from "./RoleRoute.jsx";
import { useAuth } from "./useAuth.js";

export default function AccountHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Local session state is cleared even when the API is unreachable.
    } finally {
      navigate("/events", { replace: true });
    }
  }

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <BrandMark />
        <nav className="topbar__nav" aria-label="Account navigation">
          <Link className="topbar__link" to="/events">Discover</Link>
          {user && (
            <Link className="topbar__link" to={dashboardForRole(user.role)}>
              My dashboard
            </Link>
          )}
          {user?.role === "creator" && (
            <Link className="topbar__link" to="/creator/events/new">
              Create event
            </Link>
          )}
        </nav>
        <div className="account-nav">
          {user ? (
            <>
              <span className="account-nav__identity">
                {user.name} <small>{user.email} · {user.role}</small>
              </span>
              <button className="button button--outline" type="button" onClick={() => void handleLogout()}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link className="topbar__link" to="/login">Sign in</Link>
              <Link className="button button--outline" to="/register">Join Gather</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
