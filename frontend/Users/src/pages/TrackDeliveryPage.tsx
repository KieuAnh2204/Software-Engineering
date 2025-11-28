import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import axios from "axios";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const ORDER_API = import.meta.env?.VITE_ORDER_API ?? "http://localhost:3002/api/orders";
const DRONE_API = import.meta.env?.VITE_DRONE_API ?? "http://localhost:3006/api";
const MAPTILER_KEY = import.meta.env?.VITE_MAPTILER_KEY || "2ce2qbEoSEwJcGLp8L7U";

const DEFAULT_CENTER = [106.7009, 10.7769];
const formatVND = (value: number) => `${value.toLocaleString("vi-VN")} VND`;
const FALLBACK_STYLE = "https://api.maptiler.com/maps/streets/style.json";
const DRONE_POLL_MS = 1000;
const RESTAURANT_FALLBACK = { lng: 106.7009, lat: 10.7769 };
const CUSTOMER_FALLBACK = { lng: 106.6297, lat: 10.8231 };

type Order = {
  _id: string;
  status: string;
  total_amount?: number;
  long_address?: string;
  pin_code?: string;
};

type DronePosition = {
  lat: number;
  lng: number;
  status: string;
  drone_id?: string;
  arrived_at_customer?: boolean;
};

export default function TrackDeliveryPage() {
  const params = useParams();
  const orderId = params?.orderId || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [pos, setPos] = useState<DronePosition | null>(null);
  const [etaSeconds, setEtaSeconds] = useState(900);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [notFoundCount, setNotFoundCount] = useState(0);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const restaurantMarker = useRef<Marker | null>(null);
  const customerMarker = useRef<Marker | null>(null);
  const { toast } = useToast();

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const initMap = (lng: number, lat: number) => {
    if (map.current || !mapRef.current) return;
    try {
      map.current = new maplibregl.Map({
        container: mapRef.current,
        style: `${FALLBACK_STYLE}?key=${MAPTILER_KEY}`,
        center: [lng, lat],
        zoom: 14,
      });
      setMapReady(true);
    } catch (err: any) {
      console.error("Failed to init map:", err);
      setMapError(true);
      toast({
        title: "Map error",
        description: "Cannot load map. Check MapTiler key or network.",
        variant: "destructive",
      });
    }
  };

  const ensureStaticMarkers = () => {
    if (!map.current) return;
    if (!restaurantMarker.current) {
      restaurantMarker.current = new maplibregl.Marker({ color: "#2563eb" })
        .setLngLat([RESTAURANT_FALLBACK.lng, RESTAURANT_FALLBACK.lat])
        .addTo(map.current);
    }
    if (!customerMarker.current) {
      customerMarker.current = new maplibregl.Marker({ color: "#16a34a" })
        .setLngLat([CUSTOMER_FALLBACK.lng, CUSTOMER_FALLBACK.lat])
        .addTo(map.current);
    }
  };

  const updateMarker = (lng: number, lat: number) => {
    if (!map.current) return;
    if (!marker.current) {
      marker.current = new maplibregl.Marker({ color: "#ef4444" })
        .setLngLat([lng, lat])
        .addTo(map.current);
    } else {
      marker.current.setLngLat([lng, lat]);
    }
    // Center the map to the drone on update
    map.current.flyTo({ center: [lng, lat], zoom: 14, essential: false });
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

  const fetchPosition = async () => {
    if (!orderId) return;
    try {
      const res = await axios.get(`${DRONE_API}/drone/order/${orderId}`);
      const droneData = res.data?.data;
      if (droneData && droneData.current_location) {
        const posData = {
          lat: droneData.current_location.lat,
          lng: droneData.current_location.lng,
          status: droneData.status,
          drone_id: droneData._id,
          arrived_at_customer: droneData.arrived_at_customer,
        };
        setPos(posData);
        if (!map.current) {
          initMap(posData.lng, posData.lat);
        }
        updateMarker(posData.lng, posData.lat);
        setNotFoundCount(0);
      }
    } catch (e: any) {
      // Ignore 404 when no drone is assigned yet; log others for debugging
      if (e?.response?.status === 404) {
        setNotFoundCount((c) => c + 1);
      } else {
        console.error("Failed to fetch drone position:", e);
      }
    }
  };

  useEffect(() => {
    fetchOrder();
    if (!map.current && mapRef.current) {
      initMap(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
    }
  }, [orderId]);

  const shouldPollDrone = order?.status === "delivering";

  useEffect(() => {
    if (!shouldPollDrone || mapError) return;
    fetchPosition();
    const id = setInterval(fetchPosition, DRONE_POLL_MS);
    return () => clearInterval(id);
  }, [orderId, shouldPollDrone, mapError]);

  useEffect(() => {
    const timer = setInterval(() => {
      setEtaSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!map.current && mapRef.current && !mapError) {
      initMap(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
    }
    // If a position is already known before map init, center on it
    if (map.current && pos) {
      updateMarker(pos.lng, pos.lat);
    }
    if (map.current) {
      ensureStaticMarkers();
    }
  }, [pos, mapError]);

  // Stop spamming when drone not yet assigned; show toast once
  useEffect(() => {
    if (notFoundCount === 5) {
      toast({
        title: "Assigning drone...",
        description: "Drone is being assigned. Map will update when ready.",
      });
    }
  }, [notFoundCount, toast]);

  const statusBadge = pos?.arrived_at_customer
    ? "arrived"
    : pos?.status || order?.status || "loading";
  const arrived = !!(pos?.arrived_at_customer || order?.status === "completed");

  const countdownLabel = () => {
    const minutes = Math.floor(etaSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (etaSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
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
            <Badge variant="outline" className="text-sm capitalize">{statusBadge}</Badge>
            {arrived && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href={`/drone/verify/${orderId}`}>Open PIN screen</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          <Card className="lg:col-span-3 h-[600px] overflow-hidden">
            <CardContent className="p-0 h-full">
              <div ref={mapRef} className="w-full h-full rounded-lg" />
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
                  <Badge variant="secondary" className="capitalize">{statusBadge}</Badge>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">Drone ID</span>
                  <span className="text-sm font-medium">{pos?.drone_id || "Assigning..."}</span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">Countdown</span>
                  <span className="font-mono text-sm">{countdownLabel()}</span>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Destination</p>
                  <p className="text-sm font-medium">
                    {order?.long_address || "Updating..."}
                  </p>
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
                <p>Drone updates every ~1-2s from drone-service.</p>
                <p>Drone sẽ yêu cầu bạn nhập 4 số cuối khi đến nơi.</p>
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
