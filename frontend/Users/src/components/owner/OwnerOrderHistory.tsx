import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, History } from "lucide-react";
import type { Order } from "@shared/schema";
import { format } from "date-fns";

export default function OwnerOrderHistory() {
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/owner/orders"],
  });

  const completedOrders = orders
    .filter((order) => order.status === "completed")
    .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime());

  if (isLoading) {
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
      {completedOrders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{order.dishName}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" data-testid={`badge-status-${order.id}`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(order.orderedAt), "MMM d, h:mm a")}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">${order.totalAmount}</p>
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
                  <span>Order ID: {order.id.substring(0, 8)}...</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
