import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

type PaymentStatus = "success" | "pending" | "failed";

const mapVnpResponseCode = (code?: string | null): PaymentStatus => {
  if (code === "00") return "success";
  if (code === "07" || code === "09") return "pending";
  return "failed";
};

export default function VnpayReturn() {
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const statusLabel = useMemo(() => {
    if (status === "success") return { label: "Payment successful", icon: CheckCircle2, color: "text-green-600" };
    if (status === "pending") return { label: "Payment pending", icon: Clock, color: "text-amber-500" };
    return { label: "Payment failed", icon: XCircle, color: "text-red-600" };
  }, [status]);

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(search);
    const id =
      params.get("orderId") ||
      (params.get("vnp_OrderInfo") || "").replace("order:", "");
    const txn =
      params.get("transactionId") ||
      params.get("vnp_TransactionNo") ||
      params.get("vnp_TxnRef");
    const incomingStatus =
      (params.get("status") as PaymentStatus | null) ||
      mapVnpResponseCode(params.get("vnp_ResponseCode"));

    if (id) setOrderId(id);
    if (txn) setTransactionId(txn);
    setStatus(incomingStatus);

    if (id) {
      // Navigate to order tracking after a short delay
      const timer = setTimeout(() => setLocation(`/order-status/${id}`), 1500);
      return () => clearTimeout(timer);
    }
  }, [setLocation]);

  const Icon = statusLabel.icon;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Icon className={`h-8 w-8 ${statusLabel.color}`} />
              <CardTitle className="text-2xl">{statusLabel.label}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {status === "success"
                ? "We are confirming your payment with the restaurant."
                : status === "pending"
                  ? "VNPay is still processing your transaction."
                  : "Your payment was not completed."}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-medium">{orderId || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-medium">{transactionId || "Pending"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{status}</span>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-3">
              {orderId && (
                <Button
                  className="flex-1"
                  onClick={() => setLocation(`/order-status/${orderId}`)}
                >
                  Go to tracking
                </Button>
              )}
              <Button variant="outline" asChild className="flex-1">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
