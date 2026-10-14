import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { getApiErrorMessage } from "../../api/client.js";
import AuthPageShell from "./AuthPageShell.jsx";
import { dashboardForRole } from "./RoleRoute.jsx";
import { useAuth } from "./useAuth.js";

function safeReturnPath(location) {
  const target = location.state?.from;
  const pathname = target?.pathname;
  if (!pathname || !pathname.startsWith("/") || pathname.startsWith("//")) {
    return null;
  }
  return `${pathname}${target.search || ""}${target.hash || ""}`;
}

export default function LoginPage() {
  const { user, isInitializing, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(location.state?.registered ? "Your account is ready. Sign in to continue." : "");

  if (isInitializing) {
    return <main className="auth-loading">Checking your session…</main>;
  }
  if (user) {
    return <Navigate to={dashboardForRole(user.role)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const account = await login({ email: email.trim().toLowerCase(), password });
      navigate(safeReturnPath(location) || dashboardForRole(account.role), {
        replace: true,
      });
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Sign in could not be completed. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      eyebrow="WELCOME BACK"
      title="Good to see you."
      description="Sign in to pick up where your next good plan begins."
    >
      {success && <p className="form-message form-message--success" role="status">{success}</p>}
      {error && <p className="form-message form-message--error" role="alert">{error}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          maxLength={320}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button className="button button--dark auth-form__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing you in…" : "Sign in"}
          {!isSubmitting && <span aria-hidden="true">↗</span>}
        </button>
      </form>
      <p className="auth-switch">
        New to Gather? <Link to="/register">Create an account</Link>
      </p>
    </AuthPageShell>
  );
}
