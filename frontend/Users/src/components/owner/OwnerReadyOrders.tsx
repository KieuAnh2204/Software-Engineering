import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order } from "@shared/schema";
import { format } from "date-fns";

export default function OwnerReadyOrders() {
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/owner/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/owner/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/orders"] });
      toast({ title: "Order marked as completed" });
    },
    onError: () => {
      toast({
        title: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const readyOrders = orders.filter((order) => order.status === "delivering");

  const handleMarkCompleted = (orderId: string) => {
    updateStatusMutation.mutate({ id: orderId, status: "completed" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  if (readyOrders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Truck className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Orders Ready</h3>
          <p className="text-sm text-muted-foreground">
            Orders marked as ready will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {readyOrders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{order.dishName}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="default" data-testid={`badge-status-${order.id}`}>
                    Out for Delivery
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(order.orderedAt), "MMM d, h:mm a")}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 text-primary">
                  <Truck className="h-5 w-5" />
                  <span className="text-sm font-medium">In transit</span>
                </div>
                <Button
                  onClick={() => handleMarkCompleted(order.id)}
                  disabled={updateStatusMutation.isPending}
                  data-testid={`button-completed-${order.id}`}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Completed
                </Button>
              </div>
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
