import { useEffect } from "react";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { useCart, getLastCartRestaurantId } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { formatVND } from "@/lib/currency";

export default function Cart() {
  const { cart, getCart, updateCartItem, removeFromCart, isLoading } = useCart();
  const { toast } = useToast();

  // Prefer restaurant_id from cart; fall back to last stored
  const restaurantId = cart?.restaurant_id || getLastCartRestaurantId();

  useEffect(() => {
    if (!cart && restaurantId) {
      getCart(restaurantId).catch((error: any) => {
        console.error("Failed to load cart", error);
        toast({
          title: "Error",
          description: error?.response?.data?.message || "Failed to load cart",
          variant: "destructive",
        });
      });
    }
  }, [cart, restaurantId, getCart, toast]);
  
  const cartItems = cart?.items || [];
  const subtotal = cart?.total_amount || 0;
  const deliveryFee = 25000;
  const serviceFee = 12000;
  const total = subtotal + deliveryFee + serviceFee;

  const handleUpdateQuantity = async (itemId: string, currentQuantity: number, change: number) => {
    if (!restaurantId) return;
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;

    try {
      await updateCartItem(restaurantId, itemId, newQuantity);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update cart",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!restaurantId) return;
    try {
      await removeFromCart(restaurantId, itemId);
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  if (!cart || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Your Cart</h1>
          </div>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Link href="/">
              <Button>Browse Restaurants</Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Your Cart</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item._id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Note: {item.notes}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">
                          {formatVND(item.price)}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              data-testid={`button-decrease-${item._id}`}
                              onClick={() => handleUpdateQuantity(item._id, item.quantity, -1)}
                              disabled={isLoading}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              data-testid={`button-increase-${item._id}`}
                              onClick={() => handleUpdateQuantity(item._id, item.quantity, 1)}
                              disabled={isLoading}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`button-remove-${item._id}`}
                            onClick={() => handleRemoveItem(item._id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Order Summary</h2>
                <Separator />
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery fee</span>
                    <span className="font-medium">{formatVND(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service fee</span>
                    <span className="font-medium">{formatVND(serviceFee)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary">
                      {formatVND(total)}
                    </span>
                  </div>
                </div>

                <Link href="/checkout">
                  <Button
                    className="w-full"
                    size="lg"
                    data-testid="button-proceed-checkout"
                  >
                    Proceed to Checkout
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
