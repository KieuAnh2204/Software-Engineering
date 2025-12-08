import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { createDrone, listDrones, listStations, type Drone, type Station } from "@/api/drones";

export default function DronesManagement() {
  const [drones, setDrones] = useState<Drone[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [form, setForm] = useState({
    droneId: "",
    station: "",
    status: "available" as "available" | "pickup" | "delivering" | "returning",
    lat: "",
    lng: "",
  });
  const center = useMemo<[number, number]>(() => [10.7769, 106.7009], []);

  const load = async () => {
    const [d, s] = await Promise.all([listDrones(), listStations()]);
    setDrones(d);
    setStations(s);
    if (!form.station && s.length) setForm((f) => ({ ...f, station: s[0].name }));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const handleAdd = async () => {
    if (!form.droneId || !form.station) return;
    const payload: any = {
      droneId: form.droneId,
      station: form.station,
      status: form.status,
    };
    if (form.lat) payload.lat = Number(form.lat);
    if (form.lng) payload.lng = Number(form.lng);
    try {
      await createDrone(payload);
      setForm({ ...form, droneId: "", lat: "", lng: "" });
      await load();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Drones</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Drone</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="space-y-1">
            <Label>Drone ID</Label>
            <Input
              placeholder="DRN-1001"
              value={form.droneId}
              onChange={(e) => setForm({ ...form, droneId: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Station</Label>
            <Select value={form.station} onValueChange={(v) => setForm({ ...form, station: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select station" />
              </SelectTrigger>
              <SelectContent>
                {stations.map((s) => (
                  <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">available</SelectItem>
                <SelectItem value="pickup">pickup</SelectItem>
                <SelectItem value="delivering">delivering</SelectItem>
                <SelectItem value="returning">returning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Lat (optional)</Label>
            <Input
              placeholder="10.77"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Lng (optional)</Label>
            <Input
              placeholder="106.70"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
            />
          </div>

          <div className="md:col-span-5">
            <Button onClick={handleAdd} data-testid="button-add-drone">Add Drone</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>All Drones</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drones.map((d) => (
                  <TableRow key={d._id}>
                    <TableCell className="font-medium">{d.droneId}</TableCell>
                    <TableCell>{d.station}</TableCell>
                    <TableCell><Badge>{d.status}</Badge></TableCell>
                    <TableCell>{d.battery ?? 100}%</TableCell>
                    <TableCell>{d.lat?.toFixed(5)}, {d.lng?.toFixed(5)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[520px] w-full rounded-md overflow-hidden">
              <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {drones.map((d) => (
                  <Marker key={d._id} position={[d.lat, d.lng]}>
                    <Popup>
                      <div className="space-y-1">
                        <div className="font-semibold">{d.droneId}</div>
                        <div>Station: {d.station}</div>
                        <div>Status: {d.status}</div>
                        <div>Battery: {d.battery ?? 100}%</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
