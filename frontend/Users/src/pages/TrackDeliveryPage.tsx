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
import { formatVND } from "@/utils/money";

const ORDER_API = import.meta.env?.VITE_ORDER_API ?? "http://localhost:3002/api/orders";
const DRONE_API = import.meta.env?.VITE_DRONE_API ?? "http://localhost:3006/api";
const MAPTILER_KEY = import.meta.env?.VITE_MAPTILER_KEY || "2ce2qbEoSEwJcGLp8L7U";

type Order = {
  _id: string;
  status: string;
  total_amount?: number;
  long_address?: string;
};

type DronePosition = {
  lat: number;
  lng: number;
  status: string;
  drone_id?: string;
};

export default function TrackDeliveryPage() {
  const params = useParams();
  const orderId = params?.orderId || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [pos, setPos] = useState<DronePosition | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const initMap = (lng: number, lat: number) => {
    if (map.current || !mapRef.current) return;
    map.current = new maplibregl.Map({
      container: mapRef.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
      center: [lng, lat],
      zoom: 14,
    });
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
  };

  const fetchOrder = async () => {
    if (!orderId) return;
    const res = await axios.get(`${ORDER_API}/${orderId}`, {
      headers: getAuthHeader(),
    });
    const ord = res.data?.order || res.data;
    setOrder(ord);
  };

  const fetchPosition = async () => {
    if (!orderId) return;
    try {
      const res = await axios.get(`${DRONE_API}/drone/${orderId}/position`);
      const data = res.data;
      setPos(data);
      if (!map.current) {
        initMap(data.lng, data.lat);
      }
      updateMarker(data.lng, data.lat);
    } catch (e) {
      // swallow errors when position not found yet
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    fetchPosition();
    const id = setInterval(fetchPosition, 1000);
    return () => clearInterval(id);
  }, [orderId]);

  const statusBadge = pos?.status || order?.status || "loading";
  const arrived = pos?.status === "arrived" || order?.status === "arrived";

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
            <Badge variant="outline" className="text-sm">{statusBadge}</Badge>
            {arrived && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href={`/order/${orderId}/pin`}>Open PIN screen</Link>
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
                  <Badge variant="secondary">{statusBadge}</Badge>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">Drone ID</span>
                  <span className="text-sm font-medium">{pos?.drone_id || "Assigning..."}</span>
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
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bản đồ cập nhật mỗi 1 giây từ drone-service. Khi drone đến nơi, nhấn Open PIN screen để xác nhận.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
