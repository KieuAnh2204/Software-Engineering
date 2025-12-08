import axios from "axios";

const DRONE_API =
  (import.meta.env as any)?.VITE_DRONE_API ?? "http://localhost:3006/api/drones";

export const droneClient = axios.create({
  baseURL: DRONE_API,
  withCredentials: false,
});

export type DroneStatus =
  | "available"
  | "pickup"
  | "delivering"
  | "returning";

export type Drone = {
  _id: string;
  droneId: string;
  station: string;
  lat: number;
  lng: number;
  status: DroneStatus;
  battery?: number;
  lastUpdate?: string;
};

export type Station = { name: string; lat: number; lng: number };

export async function listDrones(): Promise<Drone[]> {
  const res = await droneClient.get("/");
  return res.data?.data ?? [];
}

export async function listStations(): Promise<Station[]> {
  const res = await droneClient.get("/stations/list");
  return res.data?.data ?? [];
}

export async function createDrone(payload: {
  droneId: string;
  station: string;
  status?: DroneStatus;
  lat?: number;
  lng?: number;
  battery?: number;
}) {
  return droneClient.post("/", payload);
}

export async function tickOnce() {
  return droneClient.post("/update");
}
