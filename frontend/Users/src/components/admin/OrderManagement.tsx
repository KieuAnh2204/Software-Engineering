import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { OrderStatusStepper } from "@/components/OrderStatusStepper";
import { Separator } from "@/components/ui/separator";
import type { Order } from "@shared/schema";
import { format } from "date-fns";

export default function OrderManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        searchQuery === "" ||
        order.dishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || order.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, filterStatus]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed": return "secondary";
      case "delivering": return "default";
      case "preparing": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-orders"
          />
        </div>
        <div className="w-48">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger data-testid="select-filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="delivering">Delivering</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Dish</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    {order.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>{order.customerName || "N/A"}</TableCell>
                  <TableCell>{order.dishName}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>${order.totalAmount}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.orderedAt), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedOrder(order)}
                      data-testid={`button-view-order-${order.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>View and manage order status</DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Order ID</Label>
                  <p className="font-mono text-xs">{selectedOrder.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{selectedOrder.customerName || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dish</Label>
                  <p className="font-medium">{selectedOrder.dishName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantity</Label>
                  <p className="font-medium">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Delivery Address</Label>
                  <p className="font-medium">{selectedOrder.customerAddress || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Amount</Label>
                  <p className="font-medium">${selectedOrder.totalAmount}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Order Date</Label>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.orderedAt), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Order Status</Label>
                  <Badge variant={getStatusVariant(selectedOrder.status)} data-testid="badge-order-status">
                    {selectedOrder.status}
                  </Badge>
                </div>
                <OrderStatusStepper currentStatus={selectedOrder.status as "pending" | "preparing" | "delivering" | "completed"} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
