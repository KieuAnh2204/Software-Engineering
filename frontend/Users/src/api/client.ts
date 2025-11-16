import axios from "axios";

const USER_API =
  import.meta.env?.VITE_USER_API ?? "http://localhost:3001/api/auth";
const PRODUCT_API =
  import.meta.env?.VITE_PRODUCT_API ?? "http://localhost:3003/api";
const TOKEN_KEY = "token";

export const userClient = axios.create({
  baseURL: USER_API,
  withCredentials: true,
});

export const productClient = axios.create({
  baseURL: PRODUCT_API,
  withCredentials: true,
});

userClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}
