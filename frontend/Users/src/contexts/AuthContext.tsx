import { createContext, useState, useEffect, type ReactNode } from "react";
import { loginCustomer, registerCustomer, getCustomerMe, updateCustomerProfile } from "@/api/auth";
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
  register: (username: string, fullName: string, email: string, password: string, phone?: string, address?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<User>;
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
    
    // Backend giờ trả về user object đã merge với profile
    const userObj = payload?.user || payload;
    
    return {
      id: userObj?._id || userObj?.id || "",
      name: userObj?.full_name || userObj?.username || userObj?.email?.split("@")[0] || "",
      email: userObj?.email || "",
      phone: userObj?.phone || undefined,
      address: userObj?.address || undefined,
    };
  };

  const login = async (email: string, password: string) => {
    const response = await loginCustomer({ email, password });
    const payload = response.data;
    
    // Lưu token vào localStorage
    if (payload?.token) {
      setToken(payload.token);
      localStorage.setItem("token", payload.token);
    }
    
    // Map và lưu user
    const mapped = mapBackendUser(payload);
    setUser(mapped);
    localStorage.setItem("user", JSON.stringify(mapped));
  };

  const register = async (username: string, fullName: string, email: string, password: string, phone?: string, address?: string) => {
    const response = await registerCustomer({
      email,
      password,
      username: username || email.split("@")[0],
      full_name: fullName,
      phone: phone || "",
      address: address || "",
    });
    const payload = response.data;
    
    // Lưu token vào localStorage
    if (payload?.token) {
      setToken(payload.token);
      localStorage.setItem("token", payload.token);
    }
    
    // Map và lưu user
    const mapped = mapBackendUser(payload);
    setUser(mapped);
    localStorage.setItem("user", JSON.stringify(mapped));
  };

  const logout = () => {
    clearToken();
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      // Gọi API backend để update
      const response = await updateCustomerProfile({
        full_name: updates.name,
        phone: updates.phone,
        address: updates.address,
      });
      
      const payload = response.data;
      
      // Map lại user từ response
      const mapped = mapBackendUser(payload);
      setUser(mapped);
      localStorage.setItem("user", JSON.stringify(mapped));
      
      return mapped;
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
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
