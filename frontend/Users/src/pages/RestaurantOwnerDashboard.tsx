import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  LogOut,
  Store,
  ShoppingBag,
  Clock,
  Truck,
  History,
  ChevronDown,
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useRestaurantOwnerAuth } from "@/contexts/RestaurantOwnerAuthContext";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import OwnerDashboardOverview from "@/components/owner/OwnerDashboardOverview";
import OwnerMenuManagement from "@/components/owner/OwnerMenuManagement";
import OwnerPendingOrders from "@/components/owner/OwnerPendingOrders";
import OwnerReadyOrders from "@/components/owner/OwnerReadyOrders";
import OwnerOrderHistory from "@/components/owner/OwnerOrderHistory";
import OwnerPreparingOrders from "@/components/owner/OwnerPreparingOrders";
import OwnerDeliveringOrders from "@/components/owner/OwnerDeliveringOrders";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", value: "dashboard" },
  { icon: UtensilsCrossed, label: "Menu Item", value: "menu" },
];

const orderMenuItems = [
  { icon: Clock, label: "Pending Orders", value: "pending-orders" },
  { icon: Truck, label: "Ready Orders", value: "ready-orders" },
  { icon: Truck, label: "Delivering Orders", value: "delivering-orders" },
  { icon: History, label: "Order History", value: "order-history" },
];

export default function RestaurantOwnerDashboard() {
  const { owner, isOwnerAuthenticated, ownerLogout } = useRestaurantOwnerAuth();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState("dashboard");
  const [ordersOpen, setOrdersOpen] = useState(false);

  useEffect(() => {
    if (!isOwnerAuthenticated) {
      setLocation("/owner/login");
    }
  }, [isOwnerAuthenticated, setLocation]);

  const handleLogout = () => {
    ownerLogout();
    setLocation("/owner/login");
  };

  const handleNavigate = (view: string) => {
    setActiveView(view);
    if (view.includes("order")) {
      setOrdersOpen(true);
    }
  };

  if (!isOwnerAuthenticated) {
    return null;
  }

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full overflow-hidden">
          <Sidebar className="border-r">
            <SidebarHeader className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{owner?.restaurantName}</h2>
                  <p className="text-xs text-muted-foreground">Owner Portal</p>
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
                          onClick={() => handleNavigate(item.value)}
                          data-active={activeView === item.value}
                          data-testid={`button-nav-${item.value}`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    
                    <Collapsible open={ordersOpen} onOpenChange={setOrdersOpen}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton data-testid="button-nav-orders">
                            <ShoppingBag className="h-4 w-4" />
                            <span>Orders</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" 
                              style={{ transform: ordersOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {orderMenuItems.map((item) => (
                              <SidebarMenuSubItem key={item.value}>
                                <SidebarMenuSubButton
                                  onClick={() => handleNavigate(item.value)}
                                  data-active={activeView === item.value}
                                  data-testid={`button-nav-${item.value}`}
                                >
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.label}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
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
                        {owner?.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{owner?.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{owner?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleLogout}
                    data-testid="button-owner-logout"
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
                    {menuItems.find((item) => item.value === activeView)?.label ||
                     orderMenuItems.find((item) => item.value === activeView)?.label}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-auto p-6">
              {activeView === "dashboard" && (
                <OwnerDashboardOverview onNavigate={handleNavigate} />
              )}
              {activeView === "menu" && <OwnerMenuManagement />}
              {activeView === "pending-orders" && <OwnerPendingOrders />}
              {activeView === "ready-orders" && <OwnerPreparingOrders />}
              {activeView === "delivering-orders" && <OwnerDeliveringOrders />}
              {activeView === "order-history" && <OwnerOrderHistory />}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
