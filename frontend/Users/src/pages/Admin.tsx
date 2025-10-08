import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  ShoppingBag,
  Users,
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

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", value: "dashboard" },
  { icon: Store, label: "Restaurants", value: "restaurants" },
  { icon: UtensilsCrossed, label: "Menu Items", value: "menu" },
  { icon: ShoppingBag, label: "Orders", value: "orders" },
  { icon: Users, label: "Users", value: "users" },
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
