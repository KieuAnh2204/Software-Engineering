import { createContext, useState, useEffect, type ReactNode } from "react";
import { loginCustomer, registerCustomer, getCustomerMe } from "@/api/auth";
import { clearToken, getToken, setToken } from "@/api/client";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const mapBackendUser = (payload?: any): User => {
    if (!payload) {
      return {
        id: "",
        name: "",
        email: "",
      };
    }
    const baseUser = payload?.user || payload;
    const profile = payload?.customer || payload?.owner || baseUser;
    const derivedName =
      profile?.full_name ||
      baseUser?.full_name ||
      baseUser?.fullName ||
      baseUser?.username ||
      profile?.display_name ||
      baseUser?.email?.split("@")[0] ||
      "";
    return {
      id:
        baseUser?._id ||
        baseUser?.id ||
        profile?._id ||
        profile?.id ||
        baseUser?.email ||
        "",
      name: derivedName,
      email: baseUser?.email || profile?.email || "",
      phone: profile?.phone,
      address: profile?.address || profile?.customerProfile?.address || "",
    };
  };

  const login = async (email: string, password: string) => {
    const response = await loginCustomer({ email, password });
    const payload = response.data;
    if (payload?.token) {
      setToken(payload.token);
    }
    const mapped = mapBackendUser(payload?.customer || payload?.user || payload?.data);
    setUser(mapped);
  };

  const register = async (name: string, email: string, password: string) => {
    const username = email.split("@")[0];
    const response = await registerCustomer({
      email,
      password,
      username,
      full_name: name,
      phone: "0000000000",
      address: "N/A",
    });
    const payload = response.data;
    if (payload?.token) {
      setToken(payload.token);
    }
    const mapped = mapBackendUser(payload?.customer || payload?.user || payload?.data);
    setUser(mapped);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    }
  };

  // On mount, if token exists and user not loaded, fetch profile
  useEffect(() => {
    const maybeHydrate = async () => {
      try {
        if (!user && getToken()) {
          const response = await getCustomerMe();
          const profile = response?.data?.customer || response?.data?.user || response?.data;
          if (profile) {
            const mapped: User = {
              id: profile?.user?._id || profile?._id || "",
              name:
                profile?.user?.full_name ||
                profile?.full_name ||
                profile?.user?.username ||
                profile?.username ||
                "",
              email: profile?.user?.email || profile?.email || "",
              phone: profile?.phone,
              address: profile?.address || "",
            };
            setUser(mapped);
          }
        }
      } catch {
        // ignore and keep user null
      }
    };
    maybeHydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
