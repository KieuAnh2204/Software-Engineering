import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { getOwnerMe, loginOwner, registerOwner } from "@/api/auth";
import { clearToken, getToken, setToken } from "@/api/client";

interface RestaurantOwner {
  id: string;
  username: string;
  email: string;
  restaurantName: string;
  role: "restaurant_owner";
}

interface RestaurantOwnerAuthContextType {
  owner: RestaurantOwner | null;
  isOwnerAuthenticated: boolean;
  ownerLogin: (username: string, password: string) => Promise<void>;
  ownerRegister: (data: Record<string, unknown>) => Promise<void>;
  ownerLogout: () => void;
}

const RestaurantOwnerAuthContext = createContext<RestaurantOwnerAuthContextType | undefined>(undefined);

export function RestaurantOwnerAuthProvider({ children }: { children: ReactNode }) {
  const [owner, setOwner] = useState<RestaurantOwner | null>(() => {
    const stored = localStorage.getItem("restaurant_owner");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (owner) {
      localStorage.setItem("restaurant_owner", JSON.stringify(owner));
    } else {
      localStorage.removeItem("restaurant_owner");
    }
  }, [owner]);

  const syncOwnerState = (payload: any, fallbackUsername?: string) => {
    const ownerPayload = payload?.owner || payload;
    const userPayload = payload?.user || payload;
    const mapped: RestaurantOwner = {
      id: userPayload?._id || userPayload?.id || fallbackUsername || "",
      username: userPayload?.username || fallbackUsername || "",
      email: userPayload?.email || `${fallbackUsername || "owner"}@restaurant.com`,
      restaurantName:
        ownerPayload?.display_name ||
        ownerPayload?.name ||
        ownerPayload?.restaurantName ||
        "My Restaurant",
      role: "restaurant_owner",
    };
    setOwner(mapped);
  };

  const ownerLogin = async (username: string, password: string) => {
    const response = await loginOwner({ email: username, password });
    if (response.data?.token) {
      setToken(response.data.token);
    }
    syncOwnerState(response.data, username);
  };

  const ownerRegister = async (data: Record<string, unknown>) => {
    const response = await registerOwner(data);
    if (response.data?.token) {
      setToken(response.data.token);
    }
    syncOwnerState(response.data);
  };

  const ownerLogout = () => {
    clearToken();
    setOwner(null);
  };

  const loadOwner = async () => {
    try {
      const response = await getOwnerMe();
      if (response.data?.owner) {
        syncOwnerState({ owner: response.data.owner });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (getToken()) {
      loadOwner();
    }
  }, []);

  return (
    <RestaurantOwnerAuthContext.Provider
      value={{
        owner,
        isOwnerAuthenticated: !!owner,
        ownerLogin,
        ownerRegister,
        ownerLogout,
      }}
    >
      {children}
    </RestaurantOwnerAuthContext.Provider>
  );
}

export function useRestaurantOwnerAuth() {
  const context = useContext(RestaurantOwnerAuthContext);
  if (!context) {
    throw new Error("useRestaurantOwnerAuth must be used within RestaurantOwnerAuthProvider");
  }
  return context;
}
