import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { RestaurantOwnerAuthProvider } from "@/contexts/RestaurantOwnerAuthContext";
import { OwnerAuthProvider } from "@/contexts/OwnerAuthContext";
import { AddressConfirmationDialog } from "@/components/AddressConfirmationDialog";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import RestaurantDetail from "@/pages/RestaurantDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import RestaurantOwnerLogin from "@/pages/RestaurantOwnerLogin";
import RestaurantOwnerDashboard from "@/pages/RestaurantOwnerDashboard";
import OwnerLogin from "@/pages/OwnerLogin";
import OwnerRegister from "@/pages/OwnerRegister";
import OwnerCreateRestaurant from "@/pages/OwnerCreateRestaurant";
import OwnerHome from "@/pages/OwnerHome";
import RestaurantRegister from "@/pages/RestaurantRegister";
import OwnerDashboard from "@/pages/OwnerDashboard";
import ApiTestPage from "@/pages/ApiTestPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/restaurant/:id" component={RestaurantDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/login" component={Login} />
      <Route path="/login-customer" component={Login} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/owner/login" component={RestaurantOwnerLogin} />
      <Route path="/owner" component={RestaurantOwnerDashboard} />
      <Route path="/owner/register" component={OwnerRegister} />
      <Route path="/owner/create-restaurant" component={OwnerCreateRestaurant} />
      <Route path="/owner/auth/login" component={OwnerLogin} />
      <Route path="/owner/home" component={OwnerHome} />
      <Route path="/owner/restaurant/new" component={RestaurantRegister} />
      <Route path="/owner/dashboard" component={OwnerDashboard} />
      <Route path="/test-api" component={ApiTestPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [showAddressDialog, setShowAddressDialog] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && !user.address) {
      setShowAddressDialog(true);
    } else {
      setShowAddressDialog(false);
    }
  }, [isAuthenticated, user?.id, user?.address]);

  const handleAddressConfirmed = () => {
    setShowAddressDialog(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && user && !user.address) {
      return;
    }
    setShowAddressDialog(open);
  };

  return (
    <>
      <Router />
      <AddressConfirmationDialog
        open={showAddressDialog}
        onOpenChange={handleDialogOpenChange}
        onConfirm={handleAddressConfirmed}
        required={true}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <RestaurantOwnerAuthProvider>
              <OwnerAuthProvider>
                <TooltipProvider>
                  <Toaster />
                  <AppContent />
                </TooltipProvider>
              </OwnerAuthProvider>
            </RestaurantOwnerAuthProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
