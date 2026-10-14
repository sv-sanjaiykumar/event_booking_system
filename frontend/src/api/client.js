import axios from "axios";

export const ACCESS_TOKEN_KEY = "gather.access-token.v1";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    if (
      error.response?.status === 401 &&
      window.sessionStorage.getItem(ACCESS_TOKEN_KEY) &&
      !requestUrl.startsWith("/auth/login") &&
      !requestUrl.startsWith("/auth/register")
    ) {
      window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error, fallback) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).filter(Boolean).join(" ");
    }
    if (!error.response) {
      return "The API could not be reached. Check that the backend is running.";
    }
    if (error.response.status === 429) {
      return "Too many attempts. Please wait a moment and try again.";
    }
  }
  return fallback;
}
