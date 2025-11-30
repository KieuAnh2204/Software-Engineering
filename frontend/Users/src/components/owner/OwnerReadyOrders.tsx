import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, RefreshCcw, MapPin } from "lucide-react";
import TrackDrone from "@/components/TrackDrone";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useRestaurantOwnerAuth } from "@/contexts/RestaurantOwnerAuthContext";
import { formatVND } from "@/lib/currency";
import { getFixedRestaurantLocation } from "@/lib/restaurantLocations";

const RESTAURANT_FALLBACK = { lng: 106.7009, lat: 10.7769 };
const CUSTOMER_FALLBACK = { lng: 106.6297, lat: 10.8231 };

type OrderItem = {
  name?: string;
  quantity?: number;
  price?: number;
};

type Order = {
  _id?: string;
  id?: string;
  status?: string;
  payment_status?: string;
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
  assigned_drone_id?: string;
  restaurant_id?: string;
  customer_location?: { lat: number; lng: number };
};

export default function OwnerReadyOrders() {
  const { toast } = useToast();
  const { owner, restaurantId: ctxRestaurantId } = useRestaurantOwnerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  const token = localStorage.getItem("token") || "";
  const orderBaseUrl =
    import.meta.env.VITE_ORDER_BASE_URL ||
    import.meta.env.VITE_ORDER_API ||
    "http://localhost:3002/api/orders";
  const restaurantId =
    ctxRestaurantId ||
    localStorage.getItem("restaurant_id") ||
    localStorage.getItem("owner_restaurant_id") ||
    localStorage.getItem("restaurantId") ||
    owner?.id ||
    "";

  const fetchOrders = useCallback(async (silent = false) => {
    if (!orderBaseUrl || !restaurantId) {
      silent ? setRefreshing(false) : setLoading(false);
      toast({
        title: "Missing restaurant",
        description: "No restaurant id found for this owner.",
        variant: "destructive",
      });
      return;
    }
    try {
      silent ? setRefreshing(true) : setLoading(true);
      const res = await axios.get(
        `${orderBaseUrl}/restaurant?restaurant_id=${restaurantId}&status=ready_for_delivery`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const items: Order[] = res.data?.data || res.data?.items || [];
      setOrders(items);
      // Kick off pickup leg timers so tracking doesn't restart when reopening the dialog
      try {
        items.forEach((o) => {
          const id = o._id || o.id;
          if (!id) return;
          const key = `drone-sim-${id}-v1`;
          const raw = localStorage.getItem(key);
          const parsed = raw ? JSON.parse(raw) : {};
          if (!parsed.pickupStart) {
            parsed.pickupStart = Date.now();
            localStorage.setItem(key, JSON.stringify(parsed));
          }
          if (o.customer_location) {
            localStorage.setItem(
              `order-customer-location-${id}`,
              JSON.stringify(o.customer_location)
            );
          }
        });
      } catch {
        // ignore storage issues
      }
    } catch (err) {
      console.error("Error loading orders:", err);
      toast({
        title: "Error loading orders",
        variant: "destructive",
      });
    } finally {
      silent ? setRefreshing(false) : setLoading(false);
    }
  }, [orderBaseUrl, restaurantId, token, toast]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 5000);
    return () => clearInterval(interval);
  }, [fetchOrders, restaurantId]);

  const handleStartDelivering = async (orderId: string) => {
    if (!orderBaseUrl || !restaurantId) return;
    const restaurantLoc = getFixedRestaurantLocation(restaurantId);
    const order = orders.find((o) => (o._id || o.id) === orderId);
    const customerLoc = order?.customer_location || CUSTOMER_FALLBACK;
    try {
      await axios.patch(
        `${orderBaseUrl}/${orderId}/status`,
        { 
          status: "delivering", 
          restaurant_id: restaurantId,
          restaurant_location: { lat: restaurantLoc.lat, lng: restaurantLoc.lng },
          customer_location: customerLoc
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Persist delivery start to keep the drone path in sync across views
      try {
        const key = `drone-sim-${orderId}-v1`;
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : {};
        const next = {
          ...parsed,
          pickupDone: true,
          deliveryStart: parsed?.deliveryStart || Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore storage issues
      }

      await fetchOrders();
      toast({ title: "Order marked as delivering" });
    } catch (err) {
      console.error("Error updating order:", err);
      toast({
        title: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const readyOrders =
    orders.filter(
      (order) =>
        order.status === "ready_for_delivery" &&
        ["paid", "pending"].includes(order.payment_status || "")
    ) || [];
  const ordersToRender = readyOrders;

  if (loading && ordersToRender.length === 0) {
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
          <Truck className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Orders Ready</h3>
          <p className="text-sm text-muted-foreground">
            Orders marked as ready will appear here
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => fetchOrders(false)}
            disabled={loading || refreshing}
            data-testid="button-refresh-ready"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Ready Orders</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOrders(true)}
          disabled={loading || refreshing}
          data-testid="button-refresh-ready"
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
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
                      Ready for Delivery / Paid
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {orderedTime
                        ? format(new Date(orderedTime), "MMM d, h:mm a")
                        : "N/A"}
                    </span>
                  </div>
                  {order.assigned_drone_id && (
                    <p className="text-xs text-muted-foreground">
                      Drone: {order.assigned_drone_id}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setTrackingOrderId(orderId)}
                    data-testid={`button-track-${orderId}`}
                  >
                    <MapPin className="h-4 w-4 mr-1" /> Track Drone
                  </Button>
                  <Button
                    onClick={() => handleStartDelivering(orderId)}
                    disabled={loading || refreshing}
                    data-testid={`button-delivering-${orderId}`}
                  >
                    Start Delivering
                  </Button>
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
                    <span className="font-medium text-foreground">
                      Total: {formatVND(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      <Dialog open={!!trackingOrderId} onOpenChange={(o) => !o && setTrackingOrderId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Drone Tracking</DialogTitle>
          </DialogHeader>
          {trackingOrderId && (
            <TrackDrone
              orderId={trackingOrderId}
              height={420}
              segment="pickup"
              durationMs={10000}
              persistKey={trackingOrderId}
              restaurantLocation={getFixedRestaurantLocation(restaurantId)}
              customerLocation={
                orders.find((o) => (o._id || o.id) === trackingOrderId)?.customer_location ||
                (() => {
                  try {
                    const raw = localStorage.getItem(`order-customer-location-${trackingOrderId}`);
                    return raw ? JSON.parse(raw) : null;
                  } catch {
                    return null;
                  }
                })() ||
                CUSTOMER_FALLBACK
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
