import { createContext, useState, useEffect, type ReactNode } from "react";
import { registerOwner, loginOwner } from "@/api/ownerApi";
import { jwtDecode } from "jwt-decode";

interface Owner {
  id: string;
  email: string;
  username: string;
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
}

interface OwnerAuthContextType {
  owner: Owner | null;
  isAuthenticated: boolean;
  ownerId: string | null;
  register: (
    email: string,
    password: string,
    username: string,
    name: string,
    logo_url?: string,
    phone?: string,
    address?: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const OwnerAuthContext = createContext<OwnerAuthContextType | undefined>(
  undefined
);

export function OwnerAuthProvider({ children }: { children: ReactNode }) {
  const [owner, setOwner] = useState<Owner | null>(() => {
    const stored = localStorage.getItem("owner");
    return stored ? JSON.parse(stored) : null;
  });

  const [ownerId, setOwnerId] = useState<string | null>(() => {
    const stored = localStorage.getItem("owner_id");
    return stored || null;
  });

  useEffect(() => {
    if (owner) {
      localStorage.setItem("owner", JSON.stringify(owner));
    } else {
      localStorage.removeItem("owner");
    }
  }, [owner]);

  const extractOwnerIdFromToken = (token: string): string => {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.id || decoded.userId || decoded._id || "";
    } catch (error) {
      console.error("Failed to decode token:", error);
      return "";
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string,
    name: string,
    logo_url?: string,
    phone?: string,
    address?: string
  ) => {
    const response = await registerOwner({
      email,
      password,
      username,
      name,
      logo_url: logo_url || "",
      phone: phone || "",
      address: address || "",
    });

    const { token, owner: ownerData } = response.data;

    if (token) {
      localStorage.setItem("owner_token", token);
      const extractedOwnerId = extractOwnerIdFromToken(token);
      localStorage.setItem("owner_id", extractedOwnerId);
      setOwnerId(extractedOwnerId);
    }

    const mappedOwner: Owner = {
      id: ownerData?._id || ownerData?.id || "",
      email: ownerData?.user?.email || ownerData?.email || email,
      username: ownerData?.user?.username || ownerData?.username || username,
      name: ownerData?.display_name || name,
      status: ownerData?.status || "PENDING",
    };

    setOwner(mappedOwner);
  };

  const login = async (email: string, password: string) => {
    const response = await loginOwner({ email, password });
    const { token, owner: ownerData } = response.data;

    if (token) {
      localStorage.setItem("owner_token", token);
      const extractedOwnerId = extractOwnerIdFromToken(token);
      localStorage.setItem("owner_id", extractedOwnerId);
      setOwnerId(extractedOwnerId);
    }

    const mappedOwner: Owner = {
      id: ownerData?._id || ownerData?.id || "",
      email: ownerData?.user?.email || ownerData?.email || email,
      username: ownerData?.user?.username || ownerData?.username || "",
      name: ownerData?.display_name || "",
      status: ownerData?.status || "PENDING",
    };

    setOwner(mappedOwner);
  };

  const logout = () => {
    localStorage.removeItem("owner_token");
    localStorage.removeItem("owner_id");
    localStorage.removeItem("owner");
    setOwner(null);
    setOwnerId(null);
  };

  return (
    <OwnerAuthContext.Provider
      value={{
        owner,
        isAuthenticated: !!owner,
        ownerId,
        register,
        login,
        logout,
      }}
    >
      {children}
    </OwnerAuthContext.Provider>
  );
}
