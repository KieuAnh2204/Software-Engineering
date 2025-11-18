import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { loginAdmin } from "@/api/auth";

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

  const adminLogin = async (username: string, password: string) => {
    const response = await loginAdmin({ email: username, password });
    const data = response.data;
    const adminPayload = data?.admin || data?.user || data;

    const mapped: AdminUser = {
      id: adminPayload?.id || adminPayload?._id || username,
      username: adminPayload?.username || username,
      email: adminPayload?.email || `${adminPayload?.username || username}@foodfast.com`,
      role: adminPayload?.role === "superadmin" ? "superadmin" : "admin",
    };

    setAdmin(mapped);
  };

  const adminLogout = () => {
    console.log("Admin logout");
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
