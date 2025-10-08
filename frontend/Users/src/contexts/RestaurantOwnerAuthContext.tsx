import { createContext, useContext, useState, useEffect } from "react";

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
  ownerLogout: () => void;
}

const RestaurantOwnerAuthContext = createContext<RestaurantOwnerAuthContextType | undefined>(undefined);

export function RestaurantOwnerAuthProvider({ children }: { children: React.ReactNode }) {
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

  const ownerLogin = async (username: string, password: string) => {
    const response = await fetch("/api/auth/owner/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const ownerData = await response.json();
    
    const owner: RestaurantOwner = {
      id: ownerData.id,
      username: ownerData.username,
      email: ownerData.email || `${ownerData.username}@restaurant.com`,
      restaurantName: ownerData.restaurantName || "My Restaurant",
      role: "restaurant_owner",
    };
    
    setOwner(owner);
  };

  const ownerLogout = () => {
    console.log("Restaurant owner logout");
    setOwner(null);
  };

  return (
    <RestaurantOwnerAuthContext.Provider
      value={{
        owner,
        isOwnerAuthenticated: !!owner,
        ownerLogin,
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
