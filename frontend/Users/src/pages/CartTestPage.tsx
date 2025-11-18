import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function CartTestPage() {
  const { cart, itemCount, addToCart, isLoading } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    console.log("=== Cart Test Page ===");
    console.log("Is Authenticated:", isAuthenticated);
    console.log("User:", user);
    console.log("Cart:", cart);
    console.log("Item Count:", itemCount);
    console.log("Is Loading:", isLoading);
  }, [isAuthenticated, user, cart, itemCount, isLoading]);

  const testAddToCart = async () => {
    try {
      console.log("Testing add to cart...");
      await addToCart("restaurant_test_id", "product_test_id", 1);
      toast({
        title: "Success",
        description: "Item added to cart!",
      });
    } catch (error: any) {
      console.error("Add to cart error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add to cart",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Cart Integration Test</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Auth Status */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Authenticated:</span>
                <span className={isAuthenticated ? "text-green-600" : "text-red-600"}>
                  {isAuthenticated ? "✓ Yes" : "✗ No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>User Email:</span>
                <span className="font-mono text-sm">{user?.email || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Token:</span>
                <span className="font-mono text-xs">
                  {localStorage.getItem("token")?.slice(0, 20)}...
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Cart Status */}
          <Card>
            <CardHeader>
              <CardTitle>Cart Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Item Count:</span>
                <span className="font-bold text-lg">{itemCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Is Loading:</span>
                <span>{isLoading ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span>Cart ID:</span>
                <span className="font-mono text-xs">{cart?._id || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold">
                  {cart?.total_amount ? `${cart.total_amount.toLocaleString()} VND` : "0 VND"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Cart Items ({cart?.items?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {cart?.items && cart.items.length > 0 ? (
                <div className="space-y-2">
                  {cart.items.map((item, index) => (
                    <div key={item._id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × {item.price.toLocaleString()} VND
                        </p>
                      </div>
                      <p className="font-bold">
                        {(item.quantity * item.price).toLocaleString()} VND
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No items in cart</p>
              )}
            </CardContent>
          </Card>

          {/* Test Actions */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Test Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={testAddToCart} 
                  disabled={!isAuthenticated || isLoading}
                >
                  {isLoading ? "Loading..." : "Test Add to Cart"}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    console.log("Current Cart State:", {
                      cart,
                      itemCount,
                      isLoading,
                      isAuthenticated,
                    });
                  }}
                >
                  Log Cart State
                </Button>

                <Button 
                  variant="outline"
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  Refresh Page
                </Button>
              </div>

              {!isAuthenticated && (
                <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
                  <p className="text-sm">
                    ⚠️ You need to login first to test cart functionality.
                    Go to <a href="/login" className="underline font-semibold">Login page</a>
                  </p>
                </div>
              )}

              <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">Debug Info:</p>
                <ul className="text-xs space-y-1 font-mono">
                  <li>• Check Browser Console (F12) for detailed logs</li>
                  <li>• Check Network tab for API requests</li>
                  <li>• ORDER_API: {import.meta.env?.VITE_ORDER_API || "Not set"}</li>
                  <li>• Cart Context: {cart ? "Loaded" : "Not loaded"}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
