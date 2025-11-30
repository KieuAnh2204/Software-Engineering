import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Simulation-only component: hard-coded station, restaurant, customer.
// Smoothly animates a drone across two legs: station->restaurant, restaurant->customer.
// Status progression by segment:
//   pickup segment: pickup -> waiting_at_restaurant
//   delivery segment: delivering -> arrived

const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009]; // Ho Chi Minh City
const TICK_MS = 400; // update interval for smoothness

type LatLng = { lat: number; lng: number };
type Segment = "pickup" | "delivery";

type Props = {
  orderId: string; // still used to key simulation instance
  height?: number | string;
  onArrival?: () => void;
  onPositionChange?: (pos: Position) => void;
  restaurantLocation?: LatLng;
  customerLocation?: LatLng;
  segment?: Segment;
  durationMs?: number;
  persistKey?: string;
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

type SegmentState = {
  pickupStart?: number;
  pickupDone?: boolean;
  deliveryStart?: number;
  deliveryDone?: boolean;
};

const STORAGE_PREFIX = "drone-sim-";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const readPersisted = (key: string): SegmentState => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const writePersisted = (key: string, state: SegmentState) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
};

export default function TrackDrone({
  orderId,
  height = 400,
  onArrival,
  onPositionChange,
  restaurantLocation,
  customerLocation,
  segment = "delivery",
  durationMs = 10000,
  persistKey,
}: Props) {
  const [mapReady, setMapReady] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [state, setState] = useState<SegmentState>(() =>
    readPersisted((persistKey || STORAGE_PREFIX + orderId) + "-v1")
  );
  const stateRef = useRef<SegmentState>(state);
  const storageKey = (persistKey || STORAGE_PREFIX + orderId) + "-v1";
  // No backend errors surfaced in simulation mode; toast removed

  // Fixed coordinates (can be parameterized later)
  // Station fixed in District 10 to separate pickup leg visually from delivery leg
  const SIM_STATION = { lat: 10.7704, lng: 106.6678, name: "District-10" };
  const SIM_RESTAURANT = { lat: 10.7769, lng: 106.7009 };
  const SIM_CUSTOMER = { lat: 10.7805, lng: 106.699 };

  const station = SIM_STATION;
  const restaurant = useMemo(
    () => restaurantLocation ?? SIM_RESTAURANT,
    [restaurantLocation?.lat, restaurantLocation?.lng]
  );
  const customer = useMemo(
    () => customerLocation ?? SIM_CUSTOMER,
    [customerLocation?.lat, customerLocation?.lng]
  );

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

  const updateState = (next: SegmentState) => {
    stateRef.current = next;
    setState(next);
    writePersisted(storageKey, next);
  };

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const fresh = readPersisted(storageKey);
    stateRef.current = fresh;
    setState(fresh);
  }, [storageKey]);

  const lerpPoint = (from: LatLng, to: LatLng, t: number): LatLng => ({
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  });

  useEffect(() => {
    setMapReady(true);
  }, []);

  useEffect(() => {
    const ensureStarts = (s: SegmentState, now: number): SegmentState => {
      const next = { ...s };
      if (segment === "pickup" && !next.pickupStart) {
        next.pickupStart = now;
      }
      if (segment === "delivery") {
        if (!next.pickupDone) next.pickupDone = true;
        if (!next.deliveryStart) next.deliveryStart = now;
      }
      return next;
    };

    const computePosition = (now: number) => {
      let currentState = ensureStarts(stateRef.current, now);
      if (currentState !== stateRef.current) {
        updateState(currentState);
      }

      const segmentStart =
        segment === "pickup" ? currentState.pickupStart || now : currentState.deliveryStart || now;
      const progress = clamp01((now - segmentStart) / durationMs);

      const startPoint = segment === "pickup" ? station : restaurant;
      const endPoint = segment === "pickup" ? restaurant : customer;
      const point = lerpPoint(startPoint, endPoint, progress);

      const status =
        segment === "pickup"
          ? progress >= 1
            ? "waiting_at_restaurant"
            : "processing"
          : progress >= 1
            ? "arrived"
            : "delivering";

      const arrivedAtCustomer = segment === "delivery" && progress >= 1;

      if (segment === "pickup" && progress >= 1 && !currentState.pickupDone) {
        currentState = { ...currentState, pickupDone: true };
        updateState(currentState);
      }
      if (segment === "delivery" && progress >= 1 && !currentState.deliveryDone) {
        currentState = { ...currentState, deliveryDone: true };
        updateState(currentState);
        if (onArrival) onArrival();
      }

      const nextPosition: Position = {
        lat: point.lat,
        lng: point.lng,
        status,
        droneId: `SIM-${orderId}`,
        battery: Math.max(5, 100 - progress * 10),
        station: station.name,
        arrivedAtCustomer,
      };

      if (onPositionChange) onPositionChange(nextPosition);
      setPosition(nextPosition);
    };

    const timer = setInterval(() => computePosition(Date.now()), TICK_MS);
    computePosition(Date.now());
    return () => clearInterval(timer);
  }, [segment, durationMs, orderId, restaurant.lat, restaurant.lng, customer.lat, customer.lng, station.name, storageKey]);

  const pathPoints: [number, number][] = (() => {
    if (!position) return [];
    if (segment === "pickup" || position.status === "pickup" || position.status === "waiting_at_restaurant") {
      return [
        [station.lat, station.lng],
        [restaurant.lat, restaurant.lng],
      ];
    }
    return [
      [restaurant.lat, restaurant.lng],
      [customer.lat, customer.lng],
    ];
  })();

  return (
    <div className="space-y-3">
      <div className="w-full rounded-lg overflow-hidden border" style={{ height }}>
        {mapReady && (
          <MapContainer
            center={position ? [position.lat, position.lng] : DEFAULT_CENTER}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {position && <AutoCenter lat={position.lat} lng={position.lng} status={position.status} />}
            {position && <Marker position={[position.lat, position.lng]} icon={redIcon} />}
            <Marker position={[restaurant.lat, restaurant.lng]} icon={blueIcon} />
            <Marker position={[customer.lat, customer.lng]} icon={greenIcon} />
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
