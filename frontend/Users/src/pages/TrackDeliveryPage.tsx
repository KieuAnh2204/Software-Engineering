import { useCallback, useEffect, useRef, useState } from "react";
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
import { getFixedRestaurantLocation } from "@/lib/restaurantLocations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DronePinVerification from "@/components/DronePinVerification";

const ORDER_API = import.meta.env?.VITE_ORDER_API ?? "http://localhost:3002/api/orders";
const RESTAURANT_FALLBACK = { lng: 106.7009, lat: 10.7769 };
const CUSTOMER_FALLBACK = { lng: 106.6297, lat: 10.8231 };

type Order = {
  _id: string;
  status: string;
  total_amount?: number;
  long_address?: string;
  pin_code?: string;
  assigned_drone_id?: string;
  restaurant_id?: string;
  restaurant_location?: { lat: number; lng: number };
  customer_location?: { lat: number; lng: number };
};

export default function TrackDeliveryPage() {
  const params = useParams();
  const orderId = params?.orderId || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [droneStatus, setDroneStatus] = useState<string>("assigning");
  const [droneId, setDroneId] = useState<string | undefined>();
  const [droneArrived, setDroneArrived] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const arrivalShownRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    setDroneArrived(false);
    setDroneStatus("assigning");
    setDroneId(undefined);
    setShowPinDialog(false);
    arrivalShownRef.current = false;
  }, [orderId]);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchOrder = useCallback(
    async (silent?: boolean) => {
      if (!orderId) return;
      try {
        const res = await axios.get(`${ORDER_API}/${orderId}`, {
          headers: getAuthHeader(),
        });
        const ord = res.data?.order || res.data;
        setOrder(ord);
        if (ord?.customer_location) {
          try {
            localStorage.setItem(`order-customer-location-${orderId}`, JSON.stringify(ord.customer_location));
          } catch {
            // ignore storage errors
          }
        }
        if (ord?.assigned_drone_id) {
          setDroneId(ord.assigned_drone_id);
        }
        if (ord?.status === "completed" || ord?.status === "arrived") {
          setDroneArrived(true);
        }
        if (ord?.status === "delivering") {
          try {
            const key = `drone-sim-${orderId}-v1`;
            const raw = localStorage.getItem(key);
            const parsed = raw ? JSON.parse(raw) : {};
            if (!parsed.deliveryStart) {
              parsed.pickupDone = true;
              parsed.deliveryStart = Date.now();
              localStorage.setItem(key, JSON.stringify(parsed));
            }
          } catch {
            // ignore storage issues
          }
        }
      } catch (error: any) {
        console.error("Failed to load order", error);
        if (!silent) {
          toast({
            title: "Cannot load order",
            description: error?.response?.data?.message || "Please try again",
            variant: "destructive",
          });
        }
      }
    },
    [orderId, toast]
  );

  useEffect(() => {
    fetchOrder();
    const id = setInterval(() => fetchOrder(true), 5000);
    return () => clearInterval(id);
  }, [fetchOrder]);

  useEffect(() => {
    if (!arrivalShownRef.current && droneArrived && order?.status !== "completed") {
      arrivalShownRef.current = true;
      setShowPinDialog(true);
    }
  }, [droneArrived, order?.status]);

  const isDelivering = order?.status === "delivering";
  const arrived = droneArrived || order?.status === "completed" || order?.status === "arrived";
  const statusBadge = arrived
    ? "arrived"
    : isDelivering
      ? droneStatus || order?.status || "loading"
      : order?.status || "loading";
  const canOpenPin = arrived && order?.status !== "completed";
  const restaurantLocation =
    order?.restaurant_location ||
    (order?.restaurant_id ? getFixedRestaurantLocation(order.restaurant_id) : RESTAURANT_FALLBACK);
  const storedCustomer = (() => {
    try {
      const raw = localStorage.getItem(`order-customer-location-${orderId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const customerLocation = order?.customer_location || storedCustomer || CUSTOMER_FALLBACK;

  const handlePinSuccess = async () => {
    setShowPinDialog(false);
    setDroneArrived(true);
    setOrder((prev) => (prev ? { ...prev, status: "completed" } : prev));
    setDroneStatus("completed");
    try {
      localStorage.setItem(`order-completed-${orderId}`, Date.now().toString());
    } catch {
      // ignore storage errors
    }
    await fetchOrder(true);
  };

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
            <Button
              className="bg-green-600 hover:bg-green-700 disabled:opacity-60"
              onClick={() => setShowPinDialog(true)}
              disabled={!canOpenPin}
            >
              Open PIN
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          <Card className="lg:col-span-3 overflow-hidden">
            <CardContent className="p-0">
              {isDelivering ? (
                <TrackDrone
                  orderId={orderId}
                  restaurantLocation={restaurantLocation}
                  customerLocation={customerLocation}
                  segment="delivery"
                  durationMs={10000}
                  persistKey={orderId}
                  height={580}
                  onArrival={() => setDroneArrived(true)}
                  onPositionChange={(pos) => {
                    setDroneStatus(pos.status);
                    setDroneId(pos.droneId);
                    if (pos.arrivedAtCustomer) setDroneArrived(true);
                  }}
                />
              ) : (
                <div className="flex h-[580px] flex-col items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  <p>Tracking starts once the order is marked as delivering.</p>
                  <p className="mt-2 text-xs">
                    Current status: {order?.status || "Updating..."}
                  </p>
                </div>
              )}
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
                  <span className="text-sm font-medium">
                    {droneId || order?.assigned_drone_id || "Assigning..."}
                  </span>
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
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                  disabled={!canOpenPin}
                  onClick={() => setShowPinDialog(true)}
                >
                  Open PIN
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-lg overflow-visible">
          <DialogHeader>
            <DialogTitle>Enter delivery PIN</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <DronePinVerification orderId={orderId} onSuccess={handlePinSuccess} arrivedOverride={arrived} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
