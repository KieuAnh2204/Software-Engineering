import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Plus, MoreVertical, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDishSchema, type Dish, type InsertDish } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function MenuManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  const { data: dishes, isLoading } = useQuery<Dish[]>({
    queryKey: ["/api/admin/dishes"],
  });

  const form = useForm<InsertDish>({
    resolver: zodResolver(insertDishSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      imageUrl: "",
      isAvailable: true,
    },
  });

  const createDishMutation = useMutation({
    mutationFn: (data: InsertDish) => apiRequest("POST", "/api/admin/dishes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dishes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics/revenue"] });
      toast({
        title: "Success",
        description: "Dish created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create dish",
        variant: "destructive",
      });
    },
  });

  const updateDishMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertDish> }) =>
      apiRequest("PATCH", `/api/admin/dishes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dishes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics/revenue"] });
      toast({
        title: "Success",
        description: "Dish updated successfully",
      });
      setIsDialogOpen(false);
      setEditingDish(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update dish",
        variant: "destructive",
      });
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/admin/dishes/${id}/toggle-availability`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dishes"] });
      toast({
        title: "Success",
        description: "Dish availability updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    },
  });

  const deleteDishMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/dishes/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dishes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics/revenue"] });
      toast({
        title: "Success",
        description: "Dish deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete dish",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (dish?: Dish) => {
    if (dish) {
      setEditingDish(dish);
      form.reset({
        name: dish.name,
        description: dish.description,
        price: dish.price,
        category: dish.category,
        imageUrl: dish.imageUrl || "",
        isAvailable: dish.isAvailable,
      });
    } else {
      setEditingDish(null);
      form.reset({
        name: "",
        description: "",
        price: "",
        category: "",
        imageUrl: "",
        isAvailable: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: InsertDish) => {
    if (editingDish) {
      updateDishMutation.mutate({ id: editingDish.id, data });
    } else {
      createDishMutation.mutate(data);
    }
  };

  const filteredDishes = dishes?.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || dish.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(dishes?.map((d) => d.category) || []));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search dishes..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-dishes"
          />
        </div>
        <div className="w-64">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger data-testid="select-filter-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-dish">
          <Plus className="h-4 w-4 mr-2" />
          Add Dish
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dish Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredDishes && filteredDishes.length > 0 ? (
              filteredDishes.map((dish) => (
                <TableRow key={dish.id} data-testid={`row-dish-${dish.id}`}>
                  <TableCell className="font-medium">{dish.name}</TableCell>
                  <TableCell>{dish.category}</TableCell>
                  <TableCell>${dish.price}</TableCell>
                  <TableCell>
                    <Badge
                      variant={dish.isAvailable ? "default" : "secondary"}
                      data-testid={`badge-status-${dish.id}`}
                    >
                      {dish.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-menu-${dish.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(dish)} data-testid={`button-edit-${dish.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleAvailabilityMutation.mutate(dish.id)}
                          data-testid={`button-toggle-${dish.id}`}
                        >
                          {dish.isAvailable ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-2" />
                              Mark Unavailable
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-2" />
                              Mark Available
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteDishMutation.mutate(dish.id)}
                          data-testid={`button-delete-${dish.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No dishes found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-dish-form">
          <DialogHeader>
            <DialogTitle>{editingDish ? "Edit Dish" : "Add New Dish"}</DialogTitle>
            <DialogDescription>
              {editingDish
                ? "Update the details of your dish"
                : "Add a new dish to your restaurant menu"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dish Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Margherita Pizza" {...field} data-testid="input-dish-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your dish..."
                        {...field}
                        data-testid="input-dish-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input placeholder="12.99" {...field} data-testid="input-dish-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Pizza" {...field} data-testid="input-dish-category" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value || ""} data-testid="input-dish-image" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createDishMutation.isPending || updateDishMutation.isPending}
                  data-testid="button-submit-dish"
                >
                  {editingDish ? "Update Dish" : "Add Dish"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
