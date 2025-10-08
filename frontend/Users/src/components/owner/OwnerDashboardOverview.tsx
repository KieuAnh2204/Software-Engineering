import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingBag, TrendingUp, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RestaurantStatus, Order } from "@shared/schema";
import { format } from "date-fns";

export default function OwnerDashboardOverview() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);

  const { data: restaurantStatus } = useQuery<RestaurantStatus>({
    queryKey: ["/api/owner/restaurant/status"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/owner/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/owner/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/orders"] });
      toast({ title: "Order status updated to ready for delivery" });
    },
    onError: () => {
      toast({
        title: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const handleStatusToggle = async (checked: boolean) => {
    try {
      setIsOpen(checked);
      const response = await fetch("/api/owner/restaurant/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: checked }),
      });
      
      if (!response.ok) throw new Error("Failed to update status");
      
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

  const totalRevenue = orders.reduce((sum: number, order: Order) => 
    sum + parseFloat(order.totalAmount || "0"), 0
  );

  const todayOrders = orders.filter((order: Order) => {
    const orderDate = new Date(order.orderedAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const pendingOrders = orders.filter((order: Order) => 
    order.status === "preparing"
  );

  const handleMarkReady = (orderId: string) => {
    updateStatusMutation.mutate({ id: orderId, status: "delivering" });
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
              checked={restaurantStatus?.isOpen ?? isOpen}
              onCheckedChange={handleStatusToggle}
              data-testid="switch-restaurant-status"
            />
            <Label htmlFor="restaurant-status">
              {restaurantStatus?.isOpen ?? isOpen ? "Open for Orders" : "Closed"}
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
              ${totalRevenue.toFixed(2)}
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
              {orders.length}
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
              {todayOrders.length}
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
              {pendingOrders.length}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {pendingOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                  data-testid={`pending-order-${order.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{order.dishName}</p>
                      <Badge variant="default" data-testid={`badge-status-${order.id}`}>
                        Preparing
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Customer: {order.customerName || "N/A"}</span>
                      <span>Qty: {order.quantity}</span>
                      <span>Total: ${order.totalAmount}</span>
                      <span>{format(new Date(order.orderedAt), "MMM d, h:mm a")}</span>
                    </div>
                    {order.customerAddress && (
                      <p className="text-sm text-muted-foreground">
                        Address: {order.customerAddress}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleMarkReady(order.id)}
                    disabled={updateStatusMutation.isPending}
                    data-testid={`button-ready-${order.id}`}
                    className="ml-4"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Ready
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
