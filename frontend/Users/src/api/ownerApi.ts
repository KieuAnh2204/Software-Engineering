import axios from "axios";

const USER_API = import.meta.env.VITE_USER_API || "http://localhost:3001/api/auth";
const PRODUCT_API = import.meta.env.VITE_PRODUCT_API || "http://localhost:3003/api";

// Create axios instance for user-service (owner authentication)
const userClient = axios.create({
  baseURL: USER_API,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create axios instance for product-service (restaurant management)
const productClient = axios.create({
  baseURL: PRODUCT_API,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token interceptor for authenticated requests
const addAuthInterceptor = (client: any) => {
  client.interceptors.request.use((config: any) => {
    const token = localStorage.getItem("owner_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};

addAuthInterceptor(userClient);
addAuthInterceptor(productClient);

// =============================================
// STEP 1: Owner Registration (user-service)
// =============================================
export const registerOwner = (data: {
  email: string;
  password: string;
  username: string;
  name: string;
  logo_url?: string;
}) => userClient.post("/register/owner", data);

// =============================================
// STEP 2: Restaurant Creation (product-service)
// =============================================
export const createRestaurant = (data: {
  owner_id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  open_time: string;
  close_time: string;
}) => productClient.post("/restaurants", data);

// =============================================
// STEP 3: Owner Login (user-service)
// =============================================
export const loginOwner = (data: { 
  email: string; 
  password: string;
}) => userClient.post("/login/owner", data);

// =============================================
// Additional APIs for owner management
// =============================================
export const getOwnerRestaurants = (ownerId: string) =>
  productClient.get(`/restaurants?owner_id=${ownerId}`);

export const getOwnerProfile = () => userClient.get("/owners/me");

