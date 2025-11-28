import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import axios from "axios";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { io } from "socket.io-client";

const DRONE_STATUS_API = import.meta.env?.VITE_DRONE_STATUS_API ?? "http://localhost:3002/api/drones";
const DRONE_API = import.meta.env?.VITE_DRONE_API ?? "http://localhost:3006/api";
const DRONE_WS = import.meta.env?.VITE_DRONE_WS ?? "http://localhost:3006";
const MAPTILER_KEY = import.meta.env?.VITE_MAPTILER_KEY || "get_your_maptiler_key";

export default function DroneTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [drone, setDrone] = useState(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const droneMarker = useRef(null);
  const targetMarker = useRef(null);

  const initMap = (lng, lat) => {
    if (mapInstance.current || !mapRef.current) return;
    mapInstance.current = new maplibregl.Map({
      container: mapRef.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
      center: [lng, lat],
      zoom: 13,
    });
  };

  const updateMarkers = (d, o) => {
    if (!mapInstance.current) return;
    if (o?.delivery_location && !targetMarker.current) {
      targetMarker.current = new maplibregl.Marker({ color: "#22c55e" })
        .setLngLat([o.delivery_location.lng, o.delivery_location.lat])
        .addTo(mapInstance.current);
    }
    if (d?.current_location) {
      if (!droneMarker.current) {
        droneMarker.current = new maplibregl.Marker({ color: "#6366f1" })
          .setLngLat([d.current_location.lng, d.current_location.lat])
          .addTo(mapInstance.current);
      } else {
        droneMarker.current.setLngLat([d.current_location.lng, d.current_location.lat]);
      }
    }
  };

  const fetchOrder = async () => {
    const res = await axios.get(`${DRONE_STATUS_API}/${orderId}/status`);
    setOrder(res.data?.order || res.data);
    const droneId = res.data?.order?.assigned_drone || res.data?.assigned_drone;
    if (droneId) {
      const dRes = await axios.get(`${DRONE_API}/drone/${droneId}`);
      setDrone(dRes.data);
      const loc = dRes.data?.current_location || { lng: 106.7, lat: 10.77 };
      initMap(loc.lng, loc.lat);
      updateMarkers(dRes.data, res.data?.order || res.data);
    }
  };

  useEffect(() => {
    fetchOrder().catch(() => {});
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const socket = io(DRONE_WS, { query: { orderId }, transports: ["websocket"] });
    socket.on("drone:update", (payload) => {
      if (payload.assigned_order && String(payload.assigned_order) !== String(orderId)) return;
      setDrone(payload);
      updateMarkers(payload, order);
    });
    return () => socket.disconnect();
  }, [orderId, order]);

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Tracking Order #{orderId}</h2>
      <p className="text-sm text-slate-400 mb-3">
        Trạng thái drone: <strong>{drone?.status || "..."}</strong>
      </p>
      <div ref={mapRef} className="map-container"></div>
    </div>
  );
}
