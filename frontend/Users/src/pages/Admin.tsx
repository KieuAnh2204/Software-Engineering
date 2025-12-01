import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  MapPinned,
} from "lucide-react";
import { Header } from "@/components/Header";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { OrderStatusStepper } from "@/components/OrderStatusStepper";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Badge as StatusBadge } from "@/components/ui/badge";
import { createDrone, listDrones, listStations, type Drone, type Station } from "@/api/drones";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", value: "dashboard" },
  { icon: Store, label: "Restaurants", value: "restaurants" },
  { icon: UtensilsCrossed, label: "Menu Items", value: "menu" },
  { icon: ShoppingBag, label: "Orders", value: "orders" },
  { icon: Users, label: "Users", value: "users" },
  { icon: MapPinned, label: "Drones", value: "drones" },
];

export default function Admin() {
  const [activeView, setActiveView] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <Sidebar>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuItems.map((item) => (
                      <SidebarMenuItem key={item.value}>
                        <SidebarMenuButton
                          onClick={() => setActiveView(item.value)}
                          data-active={activeView === item.value}
                          data-testid={`button-nav-${item.value}`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <div className="flex flex-col flex-1">
            <Header />
            <main className="flex-1 overflow-auto p-6">
              {activeView === "dashboard" && <DashboardView />}
              {activeView === "restaurants" && <RestaurantsView />}
              {activeView === "menu" && <MenuItemsView />}
              {activeView === "orders" && <OrdersView />}
              {activeView === "users" && <UsersView />}
              {activeView === "drones" && <DronesView />}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}

function DashboardView() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 new this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">+16% from last month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DronesView() {
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
                    <TableCell><StatusBadge>{d.status}</StatusBadge></TableCell>
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

function RestaurantsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Restaurants</h1>
        <Button data-testid="button-add-restaurant">Add Restaurant</Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Cuisine</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Bella Italia</TableCell>
              <TableCell>Italian</TableCell>
              <TableCell>4.8</TableCell>
              <TableCell>
                <Badge>Active</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" data-testid="button-edit-restaurant-1">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" data-testid="button-delete-restaurant-1">
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Tokyo Fusion</TableCell>
              <TableCell>Japanese</TableCell>
              <TableCell>4.6</TableCell>
              <TableCell>
                <Badge>Active</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" data-testid="button-edit-restaurant-2">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" data-testid="button-delete-restaurant-2">
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function MenuItemsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Menu Items</h1>
        <Button data-testid="button-add-menu-item">Add Menu Item</Button>
      </div>
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <Label>Filter by Restaurant</Label>
            <Select defaultValue="all">
              <SelectTrigger data-testid="select-restaurant-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Restaurants</SelectItem>
                <SelectItem value="1">Bella Italia</SelectItem>
                <SelectItem value="2">Tokyo Fusion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Margherita Pizza</TableCell>
              <TableCell>Bella Italia</TableCell>
              <TableCell>$14.99</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" data-testid="button-edit-menu-1">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" data-testid="button-delete-menu-1">
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Sushi Platter</TableCell>
              <TableCell>Tokyo Fusion</TableCell>
              <TableCell>$18.99</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" data-testid="button-edit-menu-2">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" data-testid="button-delete-menu-2">
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function OrdersView() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Orders</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">#1234</TableCell>
              <TableCell>John Doe</TableCell>
              <TableCell>Bella Italia</TableCell>
              <TableCell>$42.97</TableCell>
              <TableCell>
                <Badge>Preparing</Badge>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedOrder("1234")}
                  data-testid="button-view-order-1234"
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">#1235</TableCell>
              <TableCell>Jane Smith</TableCell>
              <TableCell>Tokyo Fusion</TableCell>
              <TableCell>$38.98</TableCell>
              <TableCell>
                <Badge variant="secondary">Delivering</Badge>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedOrder("1235")}
                  data-testid="button-view-order-1235"
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {selectedOrder && (
        <Card>
          <CardHeader>
            <CardTitle>Order #{selectedOrder} Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Update Status</Label>
              <Select defaultValue="preparing">
                <SelectTrigger data-testid="select-order-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="delivering">Delivering by Drone</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <OrderStatusStepper currentStatus="preparing" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UsersView() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Users</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell>23</TableCell>
              <TableCell>
                <Badge>Active</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" data-testid="button-view-user-1">
                    View
                  </Button>
                  <Button size="sm" variant="outline" data-testid="button-disable-user-1">
                    Disable
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
              <TableCell>15</TableCell>
              <TableCell>
                <Badge>Active</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" data-testid="button-view-user-2">
                    View
                  </Button>
                  <Button size="sm" variant="outline" data-testid="button-disable-user-2">
                    Disable
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
