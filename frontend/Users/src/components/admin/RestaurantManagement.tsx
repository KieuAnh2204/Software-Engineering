import { useMemo, useState } from "react";
import { Search, MoreVertical, Eye, Ban } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";

export default function RestaurantManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);

  const { data: restaurantResponse, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/restaurants"],
  });

  const restaurants = useMemo(() => restaurantResponse?.data || [], [restaurantResponse]);

  const { data: dishesResponse, isLoading: isDishesLoading, refetch: refetchDishes } = useQuery<any>({
    queryKey: ["/api/admin/restaurants", selectedRestaurant?._id, "dishes"],
    enabled: !!selectedRestaurant?._id,
    queryFn: async () => {
      if (!selectedRestaurant?._id) return { data: [] };
      const res = await apiRequest("GET", `/api/admin/restaurants/${selectedRestaurant._id}/dishes`);
      return res.json();
    },
  });
  const dishes = dishesResponse?.data || [];

  const handleDeactivate = (restaurantId: string, restaurantName: string) => {
    toast({
      title: "Deactivate Restaurant",
      description: `Deactivate feature for ${restaurantName} will be implemented soon.`,
    });
  };

  const filtered = restaurants.filter((r: any) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.address?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q)
    );
  });

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
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Open/Close</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No restaurants found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((restaurant: any) => (
                <TableRow key={restaurant._id}>
                  <TableCell className="font-medium">{restaurant.name}</TableCell>
                  <TableCell>{restaurant.phone || "N/A"}</TableCell>
                  <TableCell className="max-w-xs truncate">{restaurant.address || "N/A"}</TableCell>
                  <TableCell>
                    {restaurant.open_time || "--"} / {restaurant.close_time || "--"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                      {restaurant.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {restaurant.created_at
                      ? new Date(restaurant.created_at).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-restaurant-menu-${restaurant._id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRestaurant(restaurant);
                            refetchDishes();
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Menu
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeactivate(restaurant._id, restaurant.name)}>
                          <Ban className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
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
                  {dishes.map((dish: any) => (
                    <TableRow key={dish._id || dish.id} data-testid={`row-dish-${dish._id || dish.id}`}>
                      <TableCell className="font-medium">{dish.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{dish.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{dish.category || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>${parseFloat(dish.price || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={(dish.isAvailable ?? dish.is_available) ? "default" : "secondary"}>
                          {(dish.isAvailable ?? dish.is_available) ? "Available" : "Unavailable"}
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
