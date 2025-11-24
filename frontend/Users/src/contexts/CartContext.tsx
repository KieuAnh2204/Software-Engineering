import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

const ORDER_API = import.meta.env?.VITE_ORDER_API ?? "http://localhost:3002/api/orders";
const LAST_CART_RESTAURANT_KEY = "last_cart_restaurant_id";

interface CartItem {
  _id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  notes?: string;
}

interface Cart {
  _id: string;
  customer_id: string;
  restaurant_id: string;
  status: string;
  items: CartItem[];
  total_amount: number;
}

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  addToCart: (restaurantId: string, productId: string, quantity?: number, notes?: string) => Promise<void>;
  updateCartItem: (restaurantId: string, itemId: string, quantity: number, notes?: string) => Promise<void>;
  removeFromCart: (restaurantId: string, itemId: string) => Promise<void>;
  clearCart: (restaurantId: string) => Promise<void>;
  getCart: (restaurantId: string) => Promise<void>;
  refreshCart: (restaurantId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate total item count
  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Get auth token
  const getToken = () => {
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  };

  // Create axios instance with auth
  const createOrderClient = () => {
    const token = getToken();
    return axios.create({
      baseURL: ORDER_API,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  // Get cart from API
  const getCart = async (restaurantId: string) => {
    const token = getToken();
    if (!token) {
      setCart(null);
      return;
    }

    try {
      setIsLoading(true);
      const client = createOrderClient();
      const response = await client.get(`/cart?restaurant_id=${restaurantId}`);
      setCart(response.data);
      try {
        localStorage.setItem(LAST_CART_RESTAURANT_KEY, restaurantId);
      } catch {
        // ignore
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No cart exists yet
        setCart(null);
      } else {
        console.error("Error fetching cart:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh cart (alias for getCart for convenience)
  const refreshCart = async (restaurantId: string) => {
    await getCart(restaurantId);
  };

  // Add item to cart
  const addToCart = async (
    restaurantId: string,
    productId: string,
    quantity: number = 1,
    notes?: string
  ) => {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    try {
      setIsLoading(true);
      const client = createOrderClient();
      const response = await client.post("/cart/items", {
        restaurant_id: restaurantId,
        productId,
        quantity,
        notes: notes || "",
      });
      setCart(response.data);
      try {
        localStorage.setItem(LAST_CART_RESTAURANT_KEY, restaurantId);
      } catch {
        // ignore
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update cart item
  const updateCartItem = async (
    restaurantId: string,
    itemId: string,
    quantity: number,
    notes?: string
  ) => {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    try {
      setIsLoading(true);
      const client = createOrderClient();
      const response = await client.patch(`/cart/items/${itemId}`, {
        restaurant_id: restaurantId,
        quantity,
        ...(notes !== undefined && { notes }),
      });
      setCart(response.data);
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (restaurantId: string, itemId: string) => {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    try {
      setIsLoading(true);
      const client = createOrderClient();
      const response = await client.delete(`/cart/items/${itemId}?restaurant_id=${restaurantId}`);
      setCart(response.data);
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async (restaurantId: string) => {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    try {
      setIsLoading(true);
      const client = createOrderClient();
      await client.delete("/cart", {
        data: { restaurant_id: restaurantId },
      });
      setCart(null);
      try {
        localStorage.removeItem(LAST_CART_RESTAURANT_KEY);
      } catch {
        // ignore
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        isLoading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        getCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Helper for consumers that need the last restaurant id even when cart is empty
export const getLastCartRestaurantId = () => {
  try {
    return localStorage.getItem(LAST_CART_RESTAURANT_KEY) || "";
  } catch {
    return "";
  }
};

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
