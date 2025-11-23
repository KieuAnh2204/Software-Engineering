import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type OrderItem = {
  name?: string;
  quantity?: number;
  price?: number;
};

type Order = {
  _id?: string;
  id?: string;
  status?: string;
  items?: OrderItem[];
  customer_name?: string;
  customerName?: string;
  long_address?: string;
  customer_address?: string;
  customerAddress?: string;
  total_amount?: number;
  totalAmount?: number;
  quantity?: number;
  orderedAt?: string;
  created_at?: string;
};

export default function OwnerPendingOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token") || "";
  const orderBaseUrl =
    import.meta.env.VITE_ORDER_BASE_URL || import.meta.env.VITE_ORDER_API;

  const fetchOrders = useCallback(async () => {
    if (!orderBaseUrl) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${orderBaseUrl}/orders?status=preparing`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOrders(res.data?.data || res.data?.items || []);
    } catch (err) {
      console.error("Error loading orders:", err);
      toast({
        title: "Error loading orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [orderBaseUrl, token, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleMarkReady = async (orderId: string) => {
    if (!orderBaseUrl) return;
    try {
      await axios.patch(
        `${orderBaseUrl}/orders/${orderId}/status`,
        { status: "ready" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchOrders();
      toast({ title: "Order marked as ready" });
    } catch (err) {
      console.error("Error updating order:", err);
      toast({
        title: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const pendingOrders =
    orders.filter((order) => order.status === "preparing") || [];
  const ordersToRender = pendingOrders.length > 0 ? pendingOrders : orders;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  if (ordersToRender.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Pending Orders</h3>
          <p className="text-sm text-muted-foreground">
            All orders have been processed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {ordersToRender.map((order) => {
        const orderId = order._id || order.id || "";
        const totalAmount = order.total_amount || order.totalAmount || 0;
        const customerName = order.customer_name || order.customerName || "N/A";
        const customerAddress =
          order.long_address || order.customer_address || order.customerAddress;
        const orderedTime = order.created_at || order.orderedAt;
        const quantity =
          order.quantity ||
          order.items?.reduce(
            (sum, item) => sum + (item.quantity || 0),
            0
          ) ||
          0;
        const dishName =
          order.items?.map((item) => item.name).filter(Boolean).join(", ") ||
          "Order";

        return (
          <Card key={orderId}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{dishName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="default"
                      data-testid={`badge-status-${orderId}`}
                    >
                      Preparing
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {orderedTime
                        ? format(new Date(orderedTime), "MMM d, h:mm a")
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => handleMarkReady(orderId)}
                  disabled={loading}
                  data-testid={`button-ready-${orderId}`}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Ready
                </Button>
              </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-1">Customer Information</p>
                <p className="text-sm text-muted-foreground">
                  {customerName}
                </p>
                {customerAddress && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {customerAddress}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Order Details</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Quantity: {quantity}</span>
                  <span className="font-medium text-foreground">
                    Total: ${totalAmount}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
