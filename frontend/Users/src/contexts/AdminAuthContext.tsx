import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { loginAdmin } from "@/api/auth";
import { setToken, clearToken } from "@/api/client";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: "admin" | "superadmin";
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAdminAuthenticated: boolean;
  adminLogin: (username: string, password: string) => Promise<void>;
  adminLogout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem("admin");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (admin) {
      localStorage.setItem("admin", JSON.stringify(admin));
    } else {
      localStorage.removeItem("admin");
    }
  }, [admin]);

  const adminLogin = async (email: string, password: string) => {
    const response = await loginAdmin({ email, password });
    const data = response.data;
    const adminPayload = data?.admin || data?.user || data;
    const token = data?.token;

    const mapped: AdminUser = {
      id: adminPayload?.id || adminPayload?._id || email,
      username: adminPayload?.username || email,
      email: adminPayload?.email || email,
      role: adminPayload?.role === "superadmin" ? "superadmin" : "admin",
    };

    // Ensure owner tokens don't override admin calls
    clearToken({ owner: true });
    setAdmin(mapped);
    if (token) {
      setToken(token);
    }
  };

  const adminLogout = () => {
    console.log("Admin logout");
    clearToken();
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAdminAuthenticated: !!admin,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
