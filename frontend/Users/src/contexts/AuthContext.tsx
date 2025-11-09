import { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, getMe, logout as apiLogout, getToken } from "@/services/auth";

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

  const login = async (email: string, password: string) => {
    const backendUser = await apiLogin({ email, password });
    const mapped: User = {
      id: backendUser?.id || backendUser?._id || "",
      name: backendUser?.fullName || backendUser?.username || "",
      email: backendUser?.email || email,
      phone: backendUser?.phone,
      address:
        backendUser?.customerProfile?.address?.street ||
        backendUser?.customerProfile?.address ||
        "",
    };
    setUser(mapped);
  };

  const register = async (name: string, email: string, password: string) => {
    console.log("Register:", { name, email, password });
    
    const mockUser: User = {
      id: "1",
      name: name,
      email: email,
      phone: "",
      address: "",
    };
    
    setUser(mockUser);
  };

  const logout = () => {
    apiLogout();
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
          const me = await getMe();
          const mapped: User = {
            id: me?.id || me?._id || "",
            name: me?.fullName || me?.username || "",
            email: me?.email || "",
            phone: me?.phone,
            address:
              me?.customerProfile?.address?.street ||
              me?.customerProfile?.address ||
              "",
          };
          setUser(mapped);
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
