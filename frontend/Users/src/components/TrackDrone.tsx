import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import axios from "axios";
import "maplibre-gl/dist/maplibre-gl.css";
import { useToast } from "@/hooks/use-toast";

const DRONE_API = import.meta.env?.VITE_DRONE_API ?? "http://localhost:3006/api/drones";
const MAPTILER_KEY = import.meta.env?.VITE_MAPTILER_KEY || "2ce2qbEoSEwJcGLp8L7U";
const STYLE_URL = `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`;
const DEFAULT_CENTER: [number, number] = [106.7009, 10.7769]; // Ho Chi Minh City
const POLL_MS = 1000;

type LatLng = { lat: number; lng: number };

type Props = {
  orderId: string;
  restaurantLocation?: LatLng;
  customerLocation?: LatLng;
  height?: number | string;
  onArrival?: () => void;
  onPositionChange?: (pos: Position) => void;
};

type Position = {
  lat: number;
  lng: number;
  status: string;
  droneId?: string;
  arrivedAtCustomer?: boolean;
  battery?: number;
};

export default function TrackDrone({
  orderId,
  restaurantLocation,
  customerLocation,
  height = 400,
  onArrival,
  onPositionChange,
}: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const droneMarker = useRef<Marker | null>(null);
  const restaurantMarker = useRef<Marker | null>(null);
  const customerMarker = useRef<Marker | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [errored, setErrored] = useState(false);
  const { toast } = useToast();

  const ensureMap = () => {
    if (mapRef.current || !mapContainer.current) return;
    try {
      mapRef.current = new maplibregl.Map({
        container: mapContainer.current,
        style: STYLE_URL,
        center: DEFAULT_CENTER,
        zoom: 13,
      });
    } catch (err: any) {
      console.error("Map init failed", err);
      setErrored(true);
      toast({
        title: "Map failed to load",
        description: "Please check your MapTiler key or network.",
        variant: "destructive",
      });
    }
  };

  const updateStaticMarkers = () => {
    if (!mapRef.current) return;
    if (restaurantLocation && !restaurantMarker.current) {
      restaurantMarker.current = new maplibregl.Marker({ color: "#2563eb" })
        .setLngLat([restaurantLocation.lng, restaurantLocation.lat])
        .addTo(mapRef.current);
    }
    if (customerLocation && !customerMarker.current) {
      customerMarker.current = new maplibregl.Marker({ color: "#16a34a" })
        .setLngLat([customerLocation.lng, customerLocation.lat])
        .addTo(mapRef.current);
    }
  };

  const moveDroneMarker = (lng: number, lat: number) => {
    if (!mapRef.current) return;
    if (!droneMarker.current) {
      droneMarker.current = new maplibregl.Marker({ color: "#ef4444" })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    } else {
      droneMarker.current.setLngLat([lng, lat]);
    }

    mapRef.current.flyTo({ center: [lng, lat], zoom: 14, essential: false, speed: 0.8 });
  };

  const fetchPosition = async () => {
    if (!orderId) return;
    try {
      const res = await axios.get(`${DRONE_API}/position/${orderId}`);
      const data = res.data?.data;
      if (!data) return;

      const pos: Position = {
        lat: data.lat,
        lng: data.lng,
        status: data.status,
        droneId: data.droneId,
        arrivedAtCustomer: data.arrivedAtCustomer,
        battery: data.battery,
      };
      setPosition(pos);
      if (onPositionChange) {
        onPositionChange(pos);
      }
      ensureMap();
      updateStaticMarkers();
      moveDroneMarker(pos.lng, pos.lat);
      if (pos.arrivedAtCustomer && onArrival) {
        onArrival();
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        // Drone not yet assigned; keep polling silently
        return;
      }
      console.error("Failed to fetch drone position", error);
      if (!errored) {
        toast({
          title: "Drone tracking error",
          description: error?.response?.data?.message || "Could not update drone position.",
          variant: "destructive",
        });
        setErrored(true);
      }
    }
  };

  useEffect(() => {
    ensureMap();
    fetchPosition();
    const id = setInterval(fetchPosition, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    ensureMap();
    updateStaticMarkers();
  }, [restaurantLocation?.lat, restaurantLocation?.lng, customerLocation?.lat, customerLocation?.lng]);

  return (
    <div className="space-y-3">
      <div
        ref={mapContainer}
        className="w-full rounded-lg overflow-hidden border"
        style={{ height }}
      />
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-medium">
          Drone {position?.droneId || "assigning..."} — {position?.status || "waiting"}
        </span>
        {position?.battery !== undefined && (
          <span className="font-mono">Battery: {Math.round(position.battery)}%</span>
        )}
      </div>
    </div>
  );
}
