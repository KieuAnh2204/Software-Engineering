import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Users,
  FileText,
  LogOut,
  Menu as MenuIcon,
  X,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import DashboardOverview from "@/components/admin/DashboardOverview";
import UserManagement from "@/components/admin/UserManagement";
import RestaurantManagement from "@/components/admin/RestaurantManagement";
import OrderManagement from "@/components/admin/OrderManagement";
import SystemLogs from "@/components/admin/SystemLogs";
import ActivityLogs from "@/components/admin/ActivityLogs";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", value: "dashboard" },
  { icon: Users, label: "Users", value: "users" },
  { icon: Store, label: "Restaurants", value: "restaurants" },
  { icon: ShoppingBag, label: "Orders", value: "orders" },
  { icon: FileText, label: "System Logs", value: "logs" },
  { icon: FileText, label: "Activity Logs", value: "activity" },
];

export default function AdminDashboard() {
  const { admin, isAdminAuthenticated, adminLogout } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAdminAuthenticated, setLocation]);

  const handleLogout = () => {
    adminLogout();
    setLocation("/admin/login");
  };

  if (!isAdminAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <Sidebar className="border-r">
            <SidebarHeader className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">FF</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg">FoodFast</h2>
                  <p className="text-xs text-muted-foreground">Restaurant Portal</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Management</SidebarGroupLabel>
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

            <SidebarFooter className="p-4">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {admin?.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{admin?.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{admin?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleLogout}
                    data-testid="button-admin-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </SidebarFooter>
          </Sidebar>

          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="border-b bg-background">
              <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold">
                    {menuItems.find((item) => item.value === activeView)?.label}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-auto p-6">
              {activeView === "dashboard" && <DashboardOverview />}
              {activeView === "users" && <UserManagement />}
              {activeView === "restaurants" && <RestaurantManagement />}
              {activeView === "orders" && <OrderManagement />}
              {activeView === "logs" && <SystemLogs />}
              {activeView === "activity" && <ActivityLogs />}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
