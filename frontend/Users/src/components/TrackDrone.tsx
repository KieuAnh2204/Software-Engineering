import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Simulation-only component: hard-coded station, restaurant, customer.
// Smoothly animates a drone across two legs: station->restaurant, restaurant->customer.
// Status progression: pickup -> waiting_at_restaurant -> delivering -> arrived

const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009]; // Ho Chi Minh City
const TICK_MS = 1000; // update interval
const SPEED_METERS_PER_SEC = 40; // demo speed

type LatLng = { lat: number; lng: number };

type Props = {
  orderId: string; // still used to key simulation instance
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
  station?: string;
};

export default function TrackDrone({ orderId, height = 400, onArrival, onPositionChange }: Props) {
  const [mapReady, setMapReady] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  // No backend errors surfaced in simulation mode; toast removed

  // Fixed coordinates (can be parameterized later)
  const SIM_STATION = { lat: 10.8231, lng: 106.6297, name: "SaiGon-North" };
  const SIM_RESTAURANT = { lat: 10.7769, lng: 106.7009 };
  const SIM_CUSTOMER = { lat: 10.7805, lng: 106.6990 };

  // Icons
  const blueIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
  const greenIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
  const redIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  // Recenter only on first render & status changes
  const AutoCenter = ({ lat, lng, status }: { lat: number; lng: number; status: string }) => {
    const map = useMap();
    const [initialized, setInitialized] = useState(false);
    const prevStatusRef = useRef<string | null>(null);
    useEffect(() => {
      const statusChanged = prevStatusRef.current && prevStatusRef.current !== status;
      if (!initialized || statusChanged) {
        map.setView([lat, lng], 14, { animate: initialized });
        setInitialized(true);
        prevStatusRef.current = status;
      }
    }, [lat, lng, status, initialized, map]);
    return null;
  };

  const toRad = (d: number) => (d * Math.PI) / 180;
  const distanceMeters = (a: LatLng, b: LatLng) => {
    const R = 6371000;
    const x = toRad(b.lng - a.lng) * Math.cos(toRad((a.lat + b.lat) / 2));
    const y = toRad(b.lat - a.lat);
    return Math.sqrt(x * x + y * y) * R;
  };
  const stepToward = (from: LatLng, to: LatLng, meters: number): LatLng => {
    const dist = distanceMeters(from, to);
    if (dist <= meters || dist === 0) return { ...to };
    const ratio = meters / dist;
    return {
      lat: from.lat + (to.lat - from.lat) * ratio,
      lng: from.lng + (to.lng - from.lng) * ratio,
    };
  };

  // Initialize simulation
  useEffect(() => {
    setPosition({
      lat: SIM_STATION.lat,
      lng: SIM_STATION.lng,
      status: "pickup",
      droneId: `SIM-${orderId}`,
      battery: 100,
      station: SIM_STATION.name,
      arrivedAtCustomer: false,
    });
    setMapReady(true);
  }, [orderId]);

  // Progress simulation
  useEffect(() => {
    if (!position) return;
    const timer = setInterval(() => {
      setPosition((prev) => {
        if (!prev) return prev;
        let next = { ...prev };
        next.battery = Math.max(0, (next.battery || 100) - 0.15);

        if (next.status === "pickup") {
          const newPos = stepToward({ lat: next.lat, lng: next.lng }, SIM_RESTAURANT, SPEED_METERS_PER_SEC);
            next.lat = newPos.lat; next.lng = newPos.lng;
            if (distanceMeters(newPos, SIM_RESTAURANT) < 30) {
              next.status = "waiting_at_restaurant";
            }
        } else if (next.status === "waiting_at_restaurant") {
          next.status = "delivering"; // immediate transition for demo
        } else if (next.status === "delivering") {
          const newPos = stepToward({ lat: next.lat, lng: next.lng }, SIM_CUSTOMER, SPEED_METERS_PER_SEC);
          next.lat = newPos.lat; next.lng = newPos.lng;
          if (distanceMeters(newPos, SIM_CUSTOMER) < 30) {
            next.status = "arrived";
            next.arrivedAtCustomer = true;
            if (onArrival) onArrival();
          }
        }
        if (onPositionChange) onPositionChange(next);
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [position, onArrival, onPositionChange]);

  const pathPoints: [number, number][] = (() => {
    if (!position) return [];
    if (position.status === "pickup" || position.status === "waiting_at_restaurant") {
      return [
        [SIM_STATION.lat, SIM_STATION.lng],
        [SIM_RESTAURANT.lat, SIM_RESTAURANT.lng],
      ];
    }
    if (position.status === "delivering" || position.status === "arrived") {
      return [
        [SIM_RESTAURANT.lat, SIM_RESTAURANT.lng],
        [SIM_CUSTOMER.lat, SIM_CUSTOMER.lng],
      ];
    }
    return [];
  })();

  return (
    <div className="space-y-3">
      <div className="w-full rounded-lg overflow-hidden border" style={{ height }}>
        {mapReady && (
          <MapContainer center={DEFAULT_CENTER} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {position && <AutoCenter lat={position.lat} lng={position.lng} status={position.status} />}
            {position && <Marker position={[position.lat, position.lng]} icon={redIcon} />}
            <Marker position={[SIM_RESTAURANT.lat, SIM_RESTAURANT.lng]} icon={blueIcon} />
            <Marker position={[SIM_CUSTOMER.lat, SIM_CUSTOMER.lng]} icon={greenIcon} />
            {pathPoints.length === 2 && (
              <Polyline
                positions={pathPoints}
                pathOptions={{
                  color: position?.status === "delivering" || position?.status === "arrived" ? "green" : "orange",
                  weight: 4,
                }}
              />
            )}
          </MapContainer>
        )}
        {!mapReady && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Đang tải bản đồ...</div>
        )}
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-medium">
          Drone {position?.droneId || "SIM"} — {position?.status || "initializing"}
        </span>
        {position?.battery !== undefined && (
          <span className="font-mono">Battery: {Math.round(position.battery)}%</span>
        )}
      </div>
    </div>
  );
}
