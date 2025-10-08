import { useState } from "react";
import { ArrowLeft, CreditCard, Banknote, Building2, Check } from "lucide-react";
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

type PaymentMethod = "cash" | "transfer" | "card";

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [deliveryAddress, setDeliveryAddress] = useState("123 Main St, Apt 4B");
  const [deliveryNote, setDeliveryNote] = useState("");

  const subtotal = 60.96;
  const deliveryFee = 2.99;
  const serviceFee = 1.50;
  const total = subtotal + deliveryFee + serviceFee;

  const handlePlaceOrder = () => {
    console.log("Order placed:", {
      paymentMethod,
      deliveryAddress,
      deliveryNote,
      total,
    });
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
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                >
                  <div
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-md border-2 cursor-pointer hover-elevate active-elevate-2 transition-colors",
                      paymentMethod === "cash"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                    onClick={() => setPaymentMethod("cash")}
                    data-testid="option-payment-cash"
                  >
                    <RadioGroupItem value="cash" id="cash" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Banknote className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Label htmlFor="cash" className="font-semibold cursor-pointer">
                          Cash on Delivery
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Pay with cash when your order arrives
                        </p>
                      </div>
                    </div>
                    {paymentMethod === "cash" && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-md border-2 cursor-pointer hover-elevate active-elevate-2 transition-colors",
                      paymentMethod === "transfer"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                    onClick={() => setPaymentMethod("transfer")}
                    data-testid="option-payment-transfer"
                  >
                    <RadioGroupItem value="transfer" id="transfer" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Label htmlFor="transfer" className="font-semibold cursor-pointer">
                          Bank Transfer
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Pay directly via bank transfer
                        </p>
                      </div>
                    </div>
                    {paymentMethod === "transfer" && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-md border-2 cursor-pointer hover-elevate active-elevate-2 transition-colors",
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                    onClick={() => setPaymentMethod("card")}
                    data-testid="option-payment-card"
                  >
                    <RadioGroupItem value="card" id="card" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Label htmlFor="card" className="font-semibold cursor-pointer">
                          Credit/Debit Card
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Pay securely with your card
                        </p>
                      </div>
                    </div>
                    {paymentMethod === "card" && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </RadioGroup>

                {paymentMethod === "transfer" && (
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-2">Bank Details:</p>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>Bank: FoodFast Bank</p>
                      <p>Account: 1234-5678-9012</p>
                      <p>Account Name: FoodFast Delivery Ltd.</p>
                    </div>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        data-testid="input-card-number"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input
                          id="expiry"
                          placeholder="MM/YY"
                          data-testid="input-card-expiry"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          type="password"
                          maxLength={3}
                          data-testid="input-card-cvv"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery fee</span>
                    <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service fee</span>
                    <span className="font-medium">${serviceFee.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePlaceOrder}
                  data-testid="button-place-order"
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
