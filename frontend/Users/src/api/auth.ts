import { userClient } from "./client";

export const registerCustomer = (data: Record<string, unknown>) =>
  userClient.post("/register/customer", data);

export const registerOwner = (data: Record<string, unknown>) =>
  userClient.post("/register/owner", data);

export const loginCustomer = (data: Record<string, unknown>) =>
  userClient.post("/login/customer", data);

export const loginOwner = (data: Record<string, unknown>) =>
  userClient.post("/login/owner", data);

export const loginAdmin = (data: Record<string, unknown>) =>
  userClient.post("/login/admin", data);

export const getCustomerMe = () => userClient.get("/customers/me");

export const getOwnerMe = () => userClient.get("/owners/me");
