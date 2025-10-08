import { createContext, useContext, useState, useEffect } from "react";

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

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
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
    const response = await fetch("/api/auth/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const adminData = await response.json();
    
    const admin: AdminUser = {
      id: adminData.id,
      username: adminData.username,
      email: adminData.email || `${adminData.username}@foodfast.com`,
      role: adminData.role === "superadmin" ? "superadmin" : "admin",
    };
    
    setAdmin(admin);
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
