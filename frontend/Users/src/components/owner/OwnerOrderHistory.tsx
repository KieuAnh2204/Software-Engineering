import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, History } from "lucide-react";
import { format } from "date-fns";

type OrderItem = {
  name?: string;
  quantity?: number;
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
  orderedAt?: string;
  created_at?: string;
};

export default function OwnerOrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token") || "";
  const orderBaseUrl =
    import.meta.env.VITE_ORDER_BASE_URL || import.meta.env.VITE_ORDER_API;

  useEffect(() => {
    const fetchOrders = async () => {
      if (!orderBaseUrl) return;
      try {
        setLoading(true);
        const res = await axios.get(
          `${orderBaseUrl}/orders?status=completed`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setOrders(res.data?.data || res.data?.items || []);
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [orderBaseUrl, token]);

  const completedOrders = useMemo(
    () =>
      (orders || [])
        .filter((order) => order.status === "completed" || !order.status)
        .sort((a, b) => {
          const dateA = new Date(a.created_at || a.orderedAt || "").getTime();
          const dateB = new Date(b.created_at || b.orderedAt || "").getTime();
          return dateB - dateA;
        }),
    [orders]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  if (completedOrders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Order History</h3>
          <p className="text-sm text-muted-foreground">
            Completed orders will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {completedOrders.map((order) => {
        const orderId = order._id || order.id || "";
        const dishName =
          order.items?.map((item) => item.name).filter(Boolean).join(", ") ||
          "Order";
        const createdAt = order.created_at || order.orderedAt;
        const totalAmount = order.total_amount || order.totalAmount || 0;
        const customerName = order.customer_name || order.customerName || "N/A";
        const customerAddress =
          order.long_address || order.customer_address || order.customerAddress;
        const quantity =
          order.items?.reduce(
            (sum, item) => sum + (item.quantity || 0),
            0
          ) || 0;

        return (
          <Card key={orderId}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{dishName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      data-testid={`badge-status-${orderId}`}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {createdAt
                        ? format(new Date(createdAt), "MMM d, h:mm a")
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">${totalAmount}</p>
                </div>
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
                    <span>Order ID: {orderId.substring(0, 8)}...</span>
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
