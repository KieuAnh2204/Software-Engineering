import { useState } from "react";
import { Search, Plus, MoreVertical, Eye, Ban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import type { Dish } from "@shared/schema";

export default function RestaurantManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);

  const { data: dishes = [], isLoading: isDishesLoading } = useQuery<Dish[]>({
    queryKey: ["/api/admin/dishes"],
  });

  const handleDeactivate = (restaurantId: string, restaurantName: string) => {
    toast({
      title: "Deactivate Restaurant",
      description: `Deactivate feature for ${restaurantName} will be implemented soon.`,
    });
  };

  const restaurants = [
    { id: "1", name: "Bella Italia", cuisine: "Italian", rating: 4.8, orders: 156, revenue: 6234.89, status: "active", menuItems: 24 },
    { id: "2", name: "Tokyo Fusion", cuisine: "Japanese", rating: 4.6, orders: 142, revenue: 5876.23, status: "active", menuItems: 31 },
    { id: "3", name: "Burger House", cuisine: "American", rating: 4.5, orders: 138, revenue: 4521.45, status: "active", menuItems: 18 },
    { id: "4", name: "Spice Garden", cuisine: "Indian", rating: 4.7, orders: 98, revenue: 3456.78, status: "inactive", menuItems: 27 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search restaurants..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-restaurants"
          />
        </div>
        <Button data-testid="button-add-restaurant">
          <Plus className="h-4 w-4 mr-2" />
          Add Restaurant
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Cuisine</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Menu Items</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {restaurants.map((restaurant) => (
              <TableRow key={restaurant.id}>
                <TableCell className="font-medium">{restaurant.name}</TableCell>
                <TableCell>{restaurant.cuisine}</TableCell>
                <TableCell>{restaurant.rating}</TableCell>
                <TableCell>{restaurant.menuItems} items</TableCell>
                <TableCell>{restaurant.orders}</TableCell>
                <TableCell>${restaurant.revenue.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={restaurant.status === "active" ? "default" : "secondary"}>
                    {restaurant.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-restaurant-menu-${restaurant.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedRestaurant(restaurant)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Menu
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeactivate(restaurant.id, restaurant.name)}>
                        <Ban className="h-4 w-4 mr-2" />
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedRestaurant} onOpenChange={() => setSelectedRestaurant(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedRestaurant?.name} - Menu Items</DialogTitle>
            <DialogDescription>
              Viewing all menu items for this restaurant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-auto">
            {isDishesLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading dishes...
              </div>
            ) : dishes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No dishes found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dishes.map((dish) => (
                    <TableRow key={dish.id} data-testid={`row-dish-${dish.id}`}>
                      <TableCell className="font-medium">{dish.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{dish.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{dish.category}</Badge>
                      </TableCell>
                      <TableCell>${parseFloat(dish.price).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={dish.isAvailable ? "default" : "secondary"}>
                          {dish.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
