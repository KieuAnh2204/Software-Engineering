import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import axios from "axios";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import TrackDrone from "@/components/TrackDrone";
import { formatVND } from "@/lib/currency";

const ORDER_API = import.meta.env?.VITE_ORDER_API ?? "http://localhost:3002/api/orders";
const RESTAURANT_FALLBACK = { lng: 106.7009, lat: 10.7769 };
const CUSTOMER_FALLBACK = { lng: 106.6297, lat: 10.8231 };

type Order = {
  _id: string;
  status: string;
  total_amount?: number;
  long_address?: string;
  pin_code?: string;
};

export default function TrackDeliveryPage() {
  const params = useParams();
  const orderId = params?.orderId || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [droneStatus, setDroneStatus] = useState<string>("assigning");
  const [droneId, setDroneId] = useState<string | undefined>();
  const [droneArrived, setDroneArrived] = useState(false);
  const { toast } = useToast();

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const res = await axios.get(`${ORDER_API}/${orderId}`, {
        headers: getAuthHeader(),
      });
      const ord = res.data?.order || res.data;
      setOrder(ord);
    } catch (error: any) {
      console.error("Failed to load order", error);
      toast({
        title: "Cannot load order",
        description: error?.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const arrived = droneArrived || order?.status === "completed";
  const statusBadge = droneArrived ? "arrived" : droneStatus || order?.status || "loading";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Track Delivery</h1>
            <p className="text-sm text-muted-foreground mt-1">Order #{orderId}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm capitalize">
              {statusBadge}
            </Badge>
            {arrived && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href={`/drone/verify/${orderId}`}>Open PIN screen</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          <Card className="lg:col-span-3 overflow-hidden">
            <CardContent className="p-0">
              <TrackDrone
                orderId={orderId}
                restaurantLocation={RESTAURANT_FALLBACK}
                customerLocation={CUSTOMER_FALLBACK}
                height={580}
                onArrival={() => setDroneArrived(true)}
                onPositionChange={(pos) => {
                  setDroneStatus(pos.status);
                  setDroneId(pos.droneId);
                  if (pos.arrivedAtCustomer) setDroneArrived(true);
                }}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Delivery Information</h3>
                <Separator />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="secondary" className="capitalize">
                    {statusBadge}
                  </Badge>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">Drone ID</span>
                  <span className="text-sm font-medium">{droneId || "Assigning..."}</span>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Destination</p>
                  <p className="text-sm font-medium">{order?.long_address || "Updating..."}</p>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Amount</span>
                  <span className="text-lg font-bold text-primary">
                    {formatVND(order?.total_amount || 0)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-sm text-muted-foreground">
                <p>Drone updates every second from the drone-service.</p>
                <p>Drone sẽ yêu cầu bạn nhập 4 số cuối của số điện thoại khi tới nơi.</p>
                {order?.pin_code && <p>PIN: {order.pin_code}</p>}
              </div>

              <div className="flex gap-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/order-status/${orderId}`}>Order details</Link>
                </Button>
                <Button
                  asChild
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                  disabled={!arrived}
                >
                  <Link href={`/drone/verify/${orderId}`}>Open PIN</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
