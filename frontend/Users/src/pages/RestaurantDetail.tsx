import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { MenuItemCard } from "@/components/MenuItemCard";
import { LoginDialog } from "@/components/LoginDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { Link, useParams } from "wouter";
import axios from "axios";

interface Restaurant {
  _id: string;
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  is_active?: boolean;
}

interface Dish {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available?: boolean;
  restaurant_id: string;
}

export default function RestaurantDetail() {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const params = useParams();
  const restaurantId = params.id || "";
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch restaurant details
        const restaurantRes = await axios.get(`http://localhost:3003/api/restaurants/${restaurantId}`);
        setRestaurant(restaurantRes.data.data);

        // Fetch dishes for this restaurant
        const dishesRes = await axios.get(`http://localhost:3003/api/dishes?restaurant_id=${restaurantId}`);
        setDishes(dishesRes.data.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load restaurant details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchData();
    }
  }, [restaurantId, toast]);

  const handleAddToCartClick = async (itemId: string, itemName: string) => {
    if (!isAuthenticated) {
      setSelectedItem({ id: itemId, name: itemName });
      setShowLoginDialog(true);
      return;
    }
    
    try {
      await addToCart(restaurantId, itemId, 1);
      toast({
        title: "Added to cart",
        description: `${itemName} has been added to your cart.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add to cart",
        variant: "destructive",
      });
    }
  };

  const handleLoginSuccess = async () => {
    if (selectedItem) {
      try {
        await addToCart(restaurantId, selectedItem.id, 1);
        toast({
          title: "Added to cart",
          description: `${selectedItem.name} has been added to your cart.`,
        });
        setSelectedItem(null);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to add to cart",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      ) : !restaurant ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg text-muted-foreground">Restaurant not found</p>
        </div>
      ) : (
        <>
          <div className="relative h-64 lg:h-80 w-full overflow-hidden">
            <img
              src={restaurant.logo_url || "/attached_assets/no_image.png"}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            <Link href="/">
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-4 left-4"
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <main className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-3">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-muted-foreground mb-4">{restaurant.description}</p>
              )}
              {restaurant.address && (
                <p className="text-sm text-muted-foreground mb-2">📍 {restaurant.address}</p>
              )}
              {restaurant.phone && (
                <p className="text-sm text-muted-foreground mb-4">📞 {restaurant.phone}</p>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">Menu</h2>
              {dishes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No dishes available</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dishes.map((dish) => (
                    <MenuItemCard
                      key={dish._id}
                      id={dish._id}
                      name={dish.name}
                      description={dish.description || ""}
                      price={dish.price}
                      image={dish.image_url || "/attached_assets/no_image.png"}
                      onAddToCart={() => handleAddToCartClick(dish._id, dish.name)}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </>
      )}

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
