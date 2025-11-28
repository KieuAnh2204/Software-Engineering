import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/formatCurrency";

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

export default function OwnerDeliveringOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token") || "";
  const orderBaseUrl =
    import.meta.env.VITE_ORDER_BASE_URL ||
    import.meta.env.VITE_ORDER_API ||
    "http://localhost:3002/api/orders";
  const restaurantId =
    localStorage.getItem("restaurant_id") ||
    localStorage.getItem("owner_restaurant_id") ||
    localStorage.getItem("restaurantId") ||
    "";

  const fetchOrders = useCallback(async () => {
    if (!orderBaseUrl || !restaurantId) {
      toast({
        title: "Missing restaurant",
        description: "No restaurant id found for this owner.",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(
        `${orderBaseUrl}/restaurant?restaurant_id=${restaurantId}&status=delivering`,
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
  }, [orderBaseUrl, token, toast, restaurantId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const ordersToRender =
    orders.filter(
      (order) =>
        order.status === "delivering"
    ) || [];

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
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Delivering Orders</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchOrders}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No delivering orders</h3>
            <p className="text-muted-foreground">
              Orders being delivered will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Delivering Orders</h2>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {ordersToRender.map((order) => {
          const orderId = order._id || order.id || "N/A";
          const customerName = order.customer_name || order.customerName || "N/A";
          const address =
            order.long_address ||
            order.customer_address ||
            order.customerAddress ||
            "N/A";
          const items = order.items || [];
          const total = order.total_amount || order.totalAmount || 0;
          const quantity = order.quantity || 0;
          const createdAt = order.orderedAt || order.created_at;

          return (
            <Card key={orderId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-lg">
                      {items[0]?.name || "Order"}
                    </CardTitle>
                    <Badge className="bg-blue-500">
                      <Truck className="h-3 w-3 mr-1" />
                      Delivering
                    </Badge>
                    {createdAt && (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(createdAt), "MMM dd, h:mm a")}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Customer Information</h4>
                    <p className="text-muted-foreground">{customerName}</p>
                    <p className="text-sm text-muted-foreground">{address}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Order Details</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quantity: {quantity}</span>
                      <span className="font-semibold">
                        Total: {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
