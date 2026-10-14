import { apiClient } from "../../api/client.js";

export async function registerAccount(account) {
  const { data } = await apiClient.post("/auth/register", {
    name: account.name,
    email: account.email,
    password: account.password,
    role: account.role,
  });
  return data;
}

export async function loginAccount(credentials) {
  const { data } = await apiClient.post("/auth/login", credentials);
  return data;
}

export async function logoutAccount() {
  await apiClient.post("/auth/logout");
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get("/auth/me");
  return data;
}
