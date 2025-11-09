// Simple auth client for user-service
// Uses Vite env: VITE_USER_SERVICE_URL (e.g., http://localhost:3001)

export const baseUrl = (import.meta as any).env?.VITE_USER_SERVICE_URL || "http://localhost:3001";

const TOKEN_KEY = "token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

type LoginPayload = { email?: string; username?: string; password: string };

export async function login(payload: LoginPayload) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || "Login failed");
  }

  const token: string | undefined = json?.data?.token;
  if (token) setToken(token);
  return json?.data?.user;
}

export async function getMe() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${baseUrl}/api/auth/customer/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || "Unauthorized");
  }
  return json?.data;
}

export function logout() {
  clearToken();
}

