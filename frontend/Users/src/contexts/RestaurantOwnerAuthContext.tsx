import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { getOwnerMe, loginOwner, registerOwner } from "@/api/auth";
import { clearToken, getToken, setToken } from "@/api/client";
import { jwtDecode } from "jwt-decode";
import { getOwnerRestaurants } from "@/api/ownerApi";

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

  const extractOwnerIdFromToken = (token: string): string => {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.owner_id || decoded.id || decoded.userId || decoded._id || "";
    } catch {
      return "";
    }
  };

  const syncOwnerState = async (payload: any, fallbackUsername?: string) => {
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

    // Fetch and store restaurant_id
    const ownerId = ownerPayload?.owner_id || ownerPayload?._id;
    if (ownerId) {
      try {
        const restaurantResponse = await getOwnerRestaurants(ownerId);
        if (restaurantResponse.data?.restaurants?.[0]?._id) {
          const restaurantId = restaurantResponse.data.restaurants[0]._id;
          localStorage.setItem("restaurant_id", restaurantId);
          localStorage.setItem("owner_restaurant_id", restaurantId);
          localStorage.setItem("restaurantId", restaurantId);
        }
      } catch (error) {
        console.error("Failed to fetch restaurant:", error);
      }
    }
  };

  const ownerLogin = async (username: string, password: string) => {
    const response = await loginOwner({ email: username, password });
    if (response.data?.token) {
      setToken(response.data.token, { owner: true });
      localStorage.setItem("owner_token", response.data.token);
      const ownerId =
        response.data?.user?.owner_id ||
        response.data?.owner?._id ||
        extractOwnerIdFromToken(response.data.token);
      if (ownerId) {
        localStorage.setItem("owner_id", ownerId);
      }
    }
    syncOwnerState(response.data, username);
  };

  const ownerRegister = async (data: Record<string, unknown>) => {
    const response = await registerOwner(data);
    if (response.data?.token) {
      setToken(response.data.token, { owner: true });
      localStorage.setItem("owner_token", response.data.token);
      const ownerId =
        response.data?.user?.owner_id ||
        response.data?.owner?._id ||
        extractOwnerIdFromToken(response.data.token);
      if (ownerId) {
        localStorage.setItem("owner_id", ownerId);
      }
    }
    syncOwnerState(response.data);
  };

  const ownerLogout = () => {
    clearToken({ owner: true });
    localStorage.removeItem("owner_token");
    localStorage.removeItem("owner_id");
    localStorage.removeItem("restaurant_id");
    localStorage.removeItem("owner_restaurant_id");
    localStorage.removeItem("restaurantId");
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
