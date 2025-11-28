import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import axios from "axios";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, RefreshCcw, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatCurrency";

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
  total_amount: number;
  items: OrderItem[];
  updated_at?: string;
  assigned_drone?: string;
  pin_code?: string;
};

export default function OrderStatus() {
  const params = useParams();
  const orderId = params?.id || "";
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const statusLabel = useMemo(() => {
    if (!order) return "";
    const mapping: Record<string, string> = {
      preparing: "Preparing",
      ready_for_delivery: "Drone on the way",
      delivering: "Delivering",
      arrived: "Arrived",
      completed: "Completed",
    };
    return `${mapping[order.status] || order.status} / ${order.payment_status}`;
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
          <CardContent className="p-6 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono text-sm">{order?._id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold">{statusLabel || "Loading..."}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Delivery address</p>
              <p className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {order?.long_address || "Not set"}
              </p>
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
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-lg">
              <span className="font-bold">Total</span>
              <span className="font-bold text-primary">{formatCurrency(order?.total_amount || 0)}</span>
            </div>

            {["confirmed", "preparing", "ready_for_delivery", "delivering", "arrived"].includes(order?.status || "") && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button asChild variant="secondary">
                  <Link href={`/order/${orderId}/track`}>Track delivery</Link>
                </Button>
                {(order?.status === "arrived" || order?.status === "delivering") && (
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href={`/order/${orderId}/pin`}>Open PIN screen</Link>
                  </Button>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Drone sẽ yêu cầu bạn nhập 4 số cuối khi đến nơi. PIN: {order?.pin_code || "****"}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
