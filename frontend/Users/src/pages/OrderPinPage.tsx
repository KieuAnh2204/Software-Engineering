import { useState } from "react";
import { useParams, useLocation } from "wouter";
import axios from "axios";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Package, CheckCircle2 } from "lucide-react";

const ORDER_API = import.meta.env?.VITE_ORDER_API ?? "http://localhost:3002/api/orders";

export default function OrderPinPage() {
  const params = useParams();
  const orderId = params?.orderId || "";
  const [pin, setPin] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const pinCode = pin.join("");

    if (pinCode.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Please enter all 4 digits",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${ORDER_API}/${orderId}/verify-pin`,
        { pin: pinCode },
        { headers: getAuthHeader() }
      );

      if (res.data?.success) {
        setVerified(true);
        toast({
          title: "Delivery Completed!",
          description: "Thank you for your order!",
        });

        setTimeout(() => {
          setLocation(`/order-status/${orderId}`);
        }, 1500);
      }
    } catch (error: any) {
      console.error("PIN verification error:", error);
      toast({
        title: "Verification Failed",
        description: error?.response?.data?.message || "Incorrect PIN. Please try again.",
        variant: "destructive",
      });
      setPin(["", "", "", ""]);
      document.getElementById("pin-0")?.focus();
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CheckCircle2 className="h-20 w-20 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Delivery Completed!</h2>
              <p className="text-muted-foreground text-center">
                Thank you for your order. Redirecting to order status...
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Drone PIN Verification</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Nhập 4 số cuối của số điện thoại đặt hàng để xác nhận giao hàng.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-3">
              {pin.map((digit, index) => (
                <Input
                  key={index}
                  id={`pin-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-14 h-14 text-center text-2xl font-bold"
                  data-testid={`pin-input-${index}`}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <Button
              onClick={handleVerify}
              disabled={loading || pin.some((d) => !d)}
              className="w-full"
              size="lg"
              data-testid="button-verify"
            >
              {loading ? "Verifying..." : "Verify PIN"}
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                The PIN is the last 4 digits of the phone number you provided during checkout
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
