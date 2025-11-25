import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingBag, TrendingUp, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Stats = {
  totalRevenue: number;
  totalOrders: number;
  todaysOrders: number;
  pendingOrders: number;
};

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
  quantity?: number;
};

export default function OwnerDashboardOverview({
  onNavigate,
}: {
  onNavigate?: (view: string) => void;
}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    todaysOrders: 0,
    pendingOrders: 0,
  });
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const token = localStorage.getItem("token") || "";
  const orderBaseUrl =
    import.meta.env.VITE_ORDER_BASE_URL || import.meta.env.VITE_ORDER_API;

  const fetchStats = useCallback(async () => {
    if (!orderBaseUrl) return;
    try {
      setLoadingStats(true);
      const res = await axios.get(`${orderBaseUrl}/orders/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data?.data || res.data || {};
      setStats({
        totalRevenue: Number(data.totalRevenue) || 0,
        totalOrders: Number(data.totalOrders) || 0,
        todaysOrders: Number(data.todaysOrders || data.todays_orders) || 0,
        pendingOrders: Number(data.pendingOrders || data.pending_orders) || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      toast({
        title: "Unable to load stats",
        variant: "destructive",
      });
    } finally {
      setLoadingStats(false);
    }
  }, [orderBaseUrl, token, toast]);

  const fetchPendingOrders = useCallback(async () => {
    if (!orderBaseUrl) return;
    try {
      setLoadingOrders(true);
      const res = await axios.get(
        `${orderBaseUrl}/orders?status=preparing`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPendingOrders(res.data?.data || res.data?.items || []);
    } catch (error) {
      console.error("Error loading pending orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  }, [orderBaseUrl, token]);

  const fetchRestaurantStatus = useCallback(async () => {
    try {
      const res = await axios.get("/api/owner/restaurant/status", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const nextStatus = res.data?.isOpen ?? res.data?.data?.isOpen;
      if (typeof nextStatus === "boolean") {
        setIsOpen(nextStatus);
      }
    } catch (error) {
      console.error("Error loading restaurant status:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
    fetchPendingOrders();
    fetchRestaurantStatus();
  }, [fetchPendingOrders, fetchRestaurantStatus, fetchStats]);

  const handleStatusToggle = async (checked: boolean) => {
    try {
      setIsOpen(checked);
      await axios.patch(
        "/api/owner/restaurant/status",
        { isOpen: checked },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Status updated",
        description: `Restaurant is now ${checked ? "open" : "closed"}`,
      });
    } catch (error) {
      setIsOpen(!checked);
      toast({
        title: "Error",
        description: "Failed to update restaurant status",
        variant: "destructive",
      });
    }
  };

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

      await fetchPendingOrders();
      await fetchStats();
      toast({ title: "Order status updated to ready" });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="restaurant-status"
              checked={isOpen}
              onCheckedChange={handleStatusToggle}
              data-testid="switch-restaurant-status"
            />
            <Label htmlFor="restaurant-status">
              {isOpen ? "Open for Orders" : "Closed"}
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              {loadingStats ? "..." : `$${stats.totalRevenue.toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-orders">
              {loadingStats ? "..." : stats.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-today-orders">
              {loadingStats ? "..." : stats.todaysOrders}
            </div>
            <p className="text-xs text-muted-foreground">In the last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-orders">
              {loadingStats
                ? "..."
                : (stats.pendingOrders || pendingOrders.length)}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate?.("pending-orders")}
                data-testid="button-view-pending"
              >
                View Pending Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {(loadingOrders || pendingOrders.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingOrders && (
                <div className="text-sm text-muted-foreground">Loading pending orders...</div>
              )}
              {pendingOrders.map((order) => {
                const orderId = order._id || order.id || "";
                const dishName =
                  order.items?.map((item) => item.name).filter(Boolean).join(", ") ||
                  "Order";
                const customerName = order.customer_name || order.customerName || "N/A";
                const customerAddress =
                  order.long_address || order.customer_address || order.customerAddress;
                const quantity =
                  order.quantity ||
                  order.items?.reduce(
                    (sum, item) => sum + (item.quantity || 0),
                    0
                  ) ||
                  0;
                const totalAmount = order.total_amount || order.totalAmount || 0;
                const orderedTime = order.created_at || order.orderedAt;

                return (
                  <div 
                    key={orderId} 
                    className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                    data-testid={`pending-order-${orderId}`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{dishName}</p>
                        <Badge variant="default" data-testid={`badge-status-${orderId}`}>
                          Preparing
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Customer: {customerName}</span>
                        <span>Qty: {quantity}</span>
                        <span>Total: ${totalAmount}</span>
                        <span>
                          {orderedTime
                            ? format(new Date(orderedTime), "MMM d, h:mm a")
                            : "N/A"}
                        </span>
                      </div>
                      {customerAddress && (
                        <p className="text-sm text-muted-foreground">
                          Address: {customerAddress}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleMarkReady(orderId)}
                      disabled={loadingOrders}
                      data-testid={`button-ready-${orderId}`}
                      className="ml-4"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Ready
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
