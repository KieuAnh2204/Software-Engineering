import { useState } from "react";
import { ShoppingCart, User, MapPin, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddressConfirmationDialog } from "./AddressConfirmationDialog";

export function Header() {
  const [location, setLocation] = useLocation();
  const isRestaurant = location.startsWith("/restaurant");
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={isRestaurant ? "/restaurant" : "/"} data-testid="link-home">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="text-2xl font-bold text-primary">FoodFast</div>
          </div>
        </Link>

        {!isRestaurant && (
          <button
            onClick={() => setAddressDialogOpen(true)}
            className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover-elevate active-elevate-2 rounded-md px-3 py-1.5 cursor-pointer"
            data-testid="button-address"
          >
            <MapPin className="h-4 w-4" />
            <span>Deliver to: <span className="text-foreground font-medium">{user?.address || "Set address"}</span></span>
          </button>
        )}

        <div className="flex items-center gap-2">
          {!isRestaurant && (
            <>
              <Link href="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  data-testid="button-cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="button-profile"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-semibold">{user?.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user?.email}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <div className="flex items-center gap-2 cursor-pointer w-full">
                          <User className="h-4 w-4" />
                          <span>My Profile</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      data-testid="button-logout"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button variant="ghost" data-testid="button-login">
                    <LogIn className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Login</span>
                  </Button>
                </Link>
              )}
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
      <AddressConfirmationDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        onConfirm={() => {}}
      />
    </header>
  );
}
