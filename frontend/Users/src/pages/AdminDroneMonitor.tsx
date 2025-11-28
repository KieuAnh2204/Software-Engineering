import { useEffect, useRef, useState } from "react";
import axios from "axios";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DRONE_API = import.meta.env?.VITE_DRONE_API ?? "http://localhost:3006/api";
const MAPTILER_KEY = import.meta.env?.VITE_MAPTILER_KEY || "2ce2qbEoSEwJcGLp8L7U";

type Drone = {
  _id: string;
  name: string;
  status: string;
  current_lat: number;
  current_lng: number;
  current_order_id?: string;
  battery?: number;
};

const statusColor: Record<string, string> = {
  available: "#22c55e",
  pickup: "#f59e0b",
  delivering: "#3b82f6",
  arrived: "#a855f7",
  returning: "#ef4444",
};

export default function AdminDroneMonitor() {
  const [drones, setDrones] = useState<Drone[]>([]);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<Record<string, Marker>>({});

  const initMap = () => {
    if (map.current || !mapRef.current) return;
    map.current = new maplibregl.Map({
      container: mapRef.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
      center: [106.700424, 10.775658],
      zoom: 11.5,
    });
  };

  const fetchDrones = async () => {
    try {
      const res = await axios.get(`${DRONE_API}/drone`);
      setDrones(res.data || []);
      if (!map.current) initMap();
      (res.data || []).forEach((d: Drone) => {
        if (!d.current_lat || !d.current_lng || !map.current) return;
        if (!markers.current[d._id]) {
          markers.current[d._id] = new maplibregl.Marker({
            color: statusColor[d.status] || "#94a3b8",
          })
            .setLngLat([d.current_lng, d.current_lat])
            .addTo(map.current);
        } else {
          markers.current[d._id]
            .setLngLat([d.current_lng, d.current_lat])
            .getElement().style.backgroundColor = statusColor[d.status] || "#94a3b8";
        }
      });
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    initMap();
    fetchDrones();
    const id = setInterval(fetchDrones, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold">Drone Monitor</h1>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 h-[520px]">
            <CardContent className="p-0 h-full">
              <div ref={mapRef} className="w-full h-full" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              {drones.map((d) => (
                <div key={d._id} className="flex justify-between border-b border-border pb-2 mb-2 text-sm">
                  <div>
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-muted-foreground">Order: {d.current_order_id || "—"}</p>
                  </div>
                  <div className="text-right">
                    <Badge>{d.status}</Badge>
                    <p className="text-muted-foreground">{(d.battery ?? 0).toFixed(0)}%</p>
                  </div>
                </div>
              ))}
              {drones.length === 0 && <p className="text-sm text-muted-foreground">No drones found</p>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
