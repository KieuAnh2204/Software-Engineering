import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import axios from "axios";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ORDER_API = import.meta.env?.VITE_ORDER_API ?? "http://localhost:3002/api/orders";

type OrderItem = {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  notes?: string;
};

type Order = {
  _id: string;
  status: string;
  payment_status: string;
  restaurant_id: string;
  long_address?: string;
  delivery_instruction?: string;
  total_amount: number;
  items: OrderItem[];
  updated_at?: string;
  pin_code?: string;
  assigned_drone_id?: string;
};

const formatVND = (v: number) => `${v.toLocaleString("vi-VN")} VND`;

export default function OrderStatus() {
  const params = useParams();
  const orderId = params?.id || "";
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const statusLabel = useMemo(() => {
    if (!order) return "";
    return `${order.status} / ${order.payment_status}`;
  }, [order]);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${ORDER_API}/${orderId}`, {
        headers: getAuthHeader(),
      });
      setOrder(res.data?.order || res.data);
    } catch (error: any) {
      console.error("Failed to load order", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to load order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const id = setInterval(fetchOrder, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <p className="text-muted-foreground">No order selected.</p>
        </main>
      </div>
    );
  }

  const statusValue = order?.status || "";
  const canTrack = statusValue === "delivering";
  const canOpenPin = statusValue === "delivering" || statusValue === "completed";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Order Status</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchOrder}
            disabled={loading}
            className="ml-auto"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono text-sm">{order?._id}</p>
                {order?.assigned_drone_id && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Drone: {order.assigned_drone_id}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold">{statusLabel || "Loading..."}</p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-3">
              <Badge variant="outline">{order?.status || "..."}</Badge>
              <Badge variant="secondary">{order?.payment_status || "..."}</Badge>
              {order?.pin_code && <Badge variant="default">PIN: {order.pin_code}</Badge>}
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Delivery address</p>
              <p className="font-medium">{order?.long_address || "Not set"}</p>
              {order?.delivery_instruction && (
                <p className="text-sm text-muted-foreground">
                  Note: {order.delivery_instruction}
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-lg font-semibold">Items</p>
              <div className="space-y-2">
                {order?.items?.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-medium">{formatVND(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button asChild variant="outline" disabled={!canTrack}>
                  <Link href={`/track/${orderId}`}>Track delivery</Link>
                </Button>
                <Button
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                  disabled={!canOpenPin}
                >
                  <Link href={`/drone/verify/${orderId}`}>Open PIN screen</Link>
                </Button>
              </div>
              <div className="text-lg font-bold text-primary">
                {formatVND(order?.total_amount || 0)}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Drone will ask for the last 4 digits when it arrives. PIN: {order?.pin_code || "****"}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
