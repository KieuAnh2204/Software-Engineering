import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order } from "@shared/schema";
import { format } from "date-fns";

export default function OwnerPendingOrders() {
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/owner/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/owner/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/orders"] });
      toast({ title: "Order marked as ready for delivery" });
    },
    onError: () => {
      toast({
        title: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const pendingOrders = orders.filter(
    (order) => order.status === "preparing"
  );

  const handleMarkReady = (orderId: string) => {
    updateStatusMutation.mutate({ id: orderId, status: "delivering" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  if (pendingOrders.length === 0) {
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
      {pendingOrders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{order.dishName}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="default" data-testid={`badge-status-${order.id}`}>
                    Preparing
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(order.orderedAt), "MMM d, h:mm a")}
                  </span>
                </div>
              </div>
              <Button
                onClick={() => handleMarkReady(order.id)}
                disabled={updateStatusMutation.isPending}
                data-testid={`button-ready-${order.id}`}
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
                  {order.customerName || "N/A"}
                </p>
                {order.customerAddress && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.customerAddress}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Order Details</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Quantity: {order.quantity}</span>
                  <span className="font-medium text-foreground">
                    Total: ${order.totalAmount}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
