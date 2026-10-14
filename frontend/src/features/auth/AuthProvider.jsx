import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ACCESS_TOKEN_KEY } from "../../api/client.js";
import {
  fetchCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount,
} from "./authApi.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const clearSession = useCallback(() => {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    const token = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      setIsInitializing(false);
      return () => {
        active = false;
      };
    }

    fetchCurrentUser()
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch(() => {
        if (active) clearSession();
      })
      .finally(() => {
        if (active) setIsInitializing(false);
      });

    return () => {
      active = false;
    };
  }, [clearSession]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
      if (location.pathname !== "/login" && location.pathname !== "/register") {
        navigate("/login", {
          replace: true,
          state: { from: location },
        });
      }
    };
    window.addEventListener("auth:expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:expired", handleSessionExpired);
    };
  }, [clearSession, location, navigate]);

  const login = useCallback(async (credentials) => {
    const response = await loginAccount(credentials);
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback((account) => registerAccount(account), []);

  const logout = useCallback(async () => {
    try {
      if (window.sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
        await logoutAccount();
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      isInitializing,
      login,
      register,
      logout,
    }),
    [user, isInitializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
