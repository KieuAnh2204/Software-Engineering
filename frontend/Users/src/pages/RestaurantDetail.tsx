import { useState } from "react";
import { ArrowLeft, Clock, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { MenuItemCard } from "@/components/MenuItemCard";
import { LoginDialog } from "@/components/LoginDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import italianRestaurant from "@assets/generated_images/Italian_restaurant_exterior_b7a0fbc1.png";
import burgerImage from "@assets/generated_images/Gourmet_burger_meal_380ed3c8.png";
import pizzaImage from "@assets/generated_images/Margherita_pizza_2e01d893.png";
import sushiImage from "@assets/generated_images/Sushi_platter_c5d624ec.png";

export default function RestaurantDetail() {
  const { isAuthenticated } = useAuth();
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { toast } = useToast();
  const restaurant = {
    name: "Bella Italia",
    image: italianRestaurant,
    cuisine: ["Italian", "Pizza", "Pasta"],
    rating: 4.8,
    deliveryTime: "25-35 min",
    deliveryFee: 2.99,
  };

  const menuItems = [
    {
      id: "1",
      name: "Classic Burger",
      description: "Juicy beef patty with fresh lettuce, tomatoes, and special sauce",
      price: 12.99,
      image: burgerImage,
    },
    {
      id: "2",
      name: "Margherita Pizza",
      description: "Fresh mozzarella, basil, and tomato sauce on wood-fired crust",
      price: 14.99,
      image: pizzaImage,
    },
    {
      id: "3",
      name: "Sushi Platter",
      description: "Assorted fresh sushi rolls with wasabi and ginger",
      price: 18.99,
      image: sushiImage,
    },
    {
      id: "4",
      name: "Caesar Salad",
      description: "Crisp romaine, parmesan, croutons, and Caesar dressing",
      price: 9.99,
      image: burgerImage,
    },
    {
      id: "5",
      name: "Pasta Carbonara",
      description: "Creamy pasta with bacon, eggs, and parmesan cheese",
      price: 13.99,
      image: pizzaImage,
    },
    {
      id: "6",
      name: "Tiramisu",
      description: "Classic Italian dessert with coffee-soaked ladyfingers",
      price: 7.99,
      image: sushiImage,
    },
  ];

  const handleAddToCartClick = (itemId: string, itemName: string) => {
    if (!isAuthenticated) {
      setSelectedItem({ id: itemId, name: itemName });
      setShowLoginDialog(true);
      return;
    }
    
    toast({
      title: "Added to cart",
      description: `${itemName} has been added to your cart.`,
    });
    console.log(`Added ${itemName} to cart`);
  };

  const handleLoginSuccess = () => {
    if (selectedItem) {
      toast({
        title: "Added to cart",
        description: `${selectedItem.name} has been added to your cart.`,
      });
      console.log(`Added ${selectedItem.name} to cart`);
      setSelectedItem(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="relative h-64 lg:h-80 w-full overflow-hidden">
        <img
          src={restaurant.image}
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
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{restaurant.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <span>{restaurant.deliveryTime}</span>
            </div>
            <span className="text-muted-foreground">
              {restaurant.deliveryFee === 0 ? "Free delivery" : `$${restaurant.deliveryFee.toFixed(2)} delivery`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {restaurant.cuisine.map((c) => (
              <Badge key={c} variant="secondary">
                {c}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Menu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <MenuItemCard
                key={item.id}
                {...item}
                onAddToCart={() => handleAddToCartClick(item.id, item.name)}
              />
            ))}
          </div>
        </div>
      </main>

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
