import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isSameDay } from "date-fns";
import { useRestaurantOwnerAuth } from "@/contexts/RestaurantOwnerAuthContext";
import { formatVND } from "@/lib/currency";

const TOTAL_ORDER_STATUSES = ["confirmed", "preparing", "ready_for_pickup", "completed"] as const;
const PENDING_STATUSES = ["pending", "payment_pending", "submitted"] as const;
const STATUS_QUERY = Array.from(
  new Set([...TOTAL_ORDER_STATUSES, ...PENDING_STATUSES, "delivering"])
).join(",");

const normalizeStatus = (status?: string) =>
  String(status || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

type Stats = {
  totalRevenue: number;
  totalOrders: number;
  todaysOrders: number;
  pendingOrders: number;
};

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
  orderedAt?: string;
  created_at?: string;
  quantity?: number;
};

const getOrderTotal = (order: Order) => {
  const rawTotal = order.total_amount ?? order.totalAmount;
  if (typeof rawTotal === "string") return parseFloat(rawTotal) || 0;
  if (typeof rawTotal === "number") return rawTotal;

  if (order.items?.length) {
    return order.items.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
      0
    );
  }
  return 0;
};

const parseOrderDate = (order: Order) => {
  const dateValue = order.created_at || order.orderedAt;
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export default function OwnerDashboardOverview({
  onNavigate,
}: {
  onNavigate?: (view: string) => void;
}) {
  const { restaurantId: ctxRestaurantId } = useRestaurantOwnerAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    todaysOrders: 0,
    pendingOrders: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const token =
    localStorage.getItem("owner_token") ||
    localStorage.getItem("token") ||
    "";
  const orderBaseUrl =
    import.meta.env.VITE_ORDER_BASE_URL ||
    import.meta.env.VITE_ORDER_API ||
    "http://localhost:3002/api/orders";
  const restaurantId =
    ctxRestaurantId ||
    localStorage.getItem("restaurant_id") ||
    localStorage.getItem("owner_restaurant_id") ||
    localStorage.getItem("restaurantId") ||
    "";

  const computeStatsFromOrders = useCallback(
    (orders: Order[]) => {
      const normalized = orders.map((order) => ({
        order,
        normalizedStatus: normalizeStatus(order.status),
        orderDate: parseOrderDate(order),
      }));

      const pending = normalized
        .filter(({ normalizedStatus }) => PENDING_STATUSES.includes(normalizedStatus))
        .map(({ order }) => order);

      const totalOrders = normalized.filter(({ normalizedStatus }) =>
        TOTAL_ORDER_STATUSES.includes(normalizedStatus)
      ).length;

      const todaysOrders = normalized.filter(
        ({ orderDate }) => orderDate && isSameDay(orderDate, new Date())
      ).length;

      const totalRevenue = normalized.reduce(
        (sum, { order }) => sum + getOrderTotal(order),
        0
      );

      setStats({
        totalRevenue,
        totalOrders,
        todaysOrders,
        pendingOrders: pending.length,
      });
    },
    []
  );

  const fetchOrdersAndStats = useCallback(async () => {
    if (!orderBaseUrl || !restaurantId) {
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        todaysOrders: 0,
        pendingOrders: 0,
      });
      return;
    }
    try {
      setLoadingStats(true);
      const res = await axios.get(`${orderBaseUrl}/restaurant`, {
        params: {
          restaurant_id: restaurantId,
          status: STATUS_QUERY,
          limit: 200,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      const orders = res.data?.data || res.data?.items || res.data?.orders || [];
      computeStatsFromOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        title: "Unable to load stats",
        description: "Could not load order metrics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingStats(false);
    }
  }, [STATUS_QUERY, computeStatsFromOrders, orderBaseUrl, restaurantId, token, toast]);

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
    fetchOrdersAndStats();
    fetchRestaurantStatus();
  }, [fetchOrdersAndStats, fetchRestaurantStatus]);

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
              {loadingStats ? "..." : formatVND(stats.totalRevenue)}
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
            <p className="text-xs text-muted-foreground">Placed today</p>
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
                : stats.pendingOrders}
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
    </div>
  );
}
