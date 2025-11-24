import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useCart, getLastCartRestaurantId } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";

type PaymentMethod = "vnpay";

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vnpay");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const { cart, getCart, isLoading } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

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

  useEffect(() => {
    const fetchAddress = async () => {
      if (!isAuthenticated) return;
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:3001/api/auth/customers/me", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const addr = res.data?.data?.customer?.address;
        if (addr) {
          setDeliveryAddress(addr);
        }
      } catch (error) {
        console.error("Failed to load user address", error);
      }
    };
    fetchAddress();
  }, [isAuthenticated]);

  const deliveryFee = 25000; // static placeholder (VND)
  const serviceFee = 12000; // static placeholder (VND)

  const subtotal = useMemo(() => {
    return cart?.total_amount || 0;
  }, [cart]);

  const total = subtotal + deliveryFee + serviceFee;

  const formatVND = (value: number) => `${value.toLocaleString("vi-VN")} ₫`;

  const handlePlaceOrder = () => {
    console.log("Order placed:", {
      paymentMethod,
      deliveryAddress,
      deliveryNote,
      total,
    });
  };

  const handleSaveAddress = async () => {
    if (!restaurantId) {
      toast({
        title: "Missing restaurant",
        description: "No restaurant found for this cart.",
        variant: "destructive",
      });
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to save your address.",
        variant: "destructive",
      });
      return;
    }
    try {
      await axios.patch(
        `${import.meta.env?.VITE_ORDER_API ?? "http://localhost:3002/api/orders"}/cart/address`,
        {
          restaurant_id: restaurantId,
          long_address: deliveryAddress,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast({ title: "Address saved", description: "Delivery address updated for this order." });
    } catch (error: any) {
      console.error("Failed to save address", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to save address",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/cart">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    data-testid="input-address"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleSaveAddress}
                    disabled={!deliveryAddress}
                    data-testid="button-save-address"
                  >
                    Save address to order
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Delivery Instructions (Optional)</Label>
                  <Textarea
                    id="note"
                    placeholder="E.g., Ring doorbell, leave at door..."
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    data-testid="input-delivery-note"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                  <div
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-md border-2 cursor-pointer hover-elevate active-elevate-2 transition-colors",
                      "border-primary bg-primary/5"
                    )}
                    onClick={() => setPaymentMethod("vnpay")}
                    data-testid="option-payment-vnpay"
                  >
                    <RadioGroupItem value="vnpay" id="vnpay" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Label htmlFor="vnpay" className="font-semibold cursor-pointer">
                          VNPAY
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Pay securely via VNPAY
                        </p>
                      </div>
                    </div>
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
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

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePlaceOrder}
                  data-testid="button-place-order"
                  disabled={!cart || cart.items.length === 0 || isLoading}
                >
                  Place Order
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By placing this order, you agree to our Terms & Conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
