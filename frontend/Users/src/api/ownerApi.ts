import axios from "axios";

const USER_API = import.meta.env.VITE_USER_API || "http://localhost:3001/api/auth";
const PRODUCT_API = import.meta.env.VITE_PRODUCT_API || "http://localhost:3003/api";

// Create axios instance for owner operations
const ownerClient = axios.create({
  baseURL: USER_API,
  headers: {
    "Content-Type": "application/json",
  },
});

const productClient = axios.create({
  baseURL: PRODUCT_API,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
ownerClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("owner_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

productClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("owner_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Owner Auth APIs
export const registerOwner = (data: {
  email: string;
  password: string;
  username: string;
  name: string; // Tên đầy đủ của owner, backend lưu vào display_name
  phone: string;
  address: string;
  logo_url?: string;
}) => ownerClient.post("/register/owner", data);

export const loginOwner = (data: { email: string; password: string }) =>
  ownerClient.post("/login/owner", data);

// Restaurant APIs
export const createRestaurant = (data: {
  owner_id: string;
  name: string;
  description: string;
  phone: string;
  address: string;
  logo_url?: string;
  open_time: string;
  close_time: string;
}) => productClient.post("/restaurants", data);

export const getOwnerRestaurants = (ownerId: string) =>
  productClient.get(`/restaurants?owner_id=${ownerId}`);
