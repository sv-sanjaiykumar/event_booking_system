import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { getApiErrorMessage } from "../../api/client.js";
import AuthPageShell from "./AuthPageShell.jsx";
import { dashboardForRole } from "./RoleRoute.jsx";
import { useAuth } from "./useAuth.js";

function isStrongPassword(password) {
  const groups = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  return password.length >= 12 && !/^\s|\s$/.test(password) &&
    groups.filter(Boolean).length >= 3;
}

export default function RegisterPage() {
  const { user, isInitializing, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("attendee");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isInitializing) {
    return <main className="auth-loading">Checking your session…</main>;
  }
  if (user) {
    return <Navigate to={dashboardForRole(user.role)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim()) {
      setError("Enter your name to create an account.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError("Use at least 12 characters and include at least three character groups: lowercase, uppercase, numbers, and symbols.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role,
      });
      navigate("/login", {
        replace: true,
        state: { registered: true, from: location.state?.from },
      });
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Your account could not be created. Please review your details and try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      eyebrow="FIND YOUR PEOPLE"
      title="Make an account."
      description="Choose how you’d like to join the Gather community."
    >
      {error && <p className="form-message form-message--error" role="alert">{error}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="register-name">Full name</label>
        <input
          id="register-name"
          name="name"
          autoComplete="name"
          required
          maxLength={200}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <label htmlFor="register-email">Email address</label>
        <input
          id="register-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          maxLength={320}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label htmlFor="register-role">I’m here as</label>
        <select
          id="register-role"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="attendee">Attendee</option>
          <option value="creator">Event creator</option>
        </select>
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          name="new-password"
          autoComplete="new-password"
          required
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby="password-policy"
        />
        <p className="field-hint" id="password-policy">
          At least 12 characters, with three of lowercase, uppercase, numbers, and symbols.
        </p>
        <label htmlFor="register-confirm-password">Confirm password</label>
        <input
          id="register-confirm-password"
          type="password"
          name="confirm-password"
          autoComplete="new-password"
          required
          maxLength={128}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <button className="button button--dark auth-form__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating your account…" : "Create account"}
          {!isSubmitting && <span aria-hidden="true">↗</span>}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login" state={location.state}>Sign in</Link>
      </p>
    </AuthPageShell>
  );
}
