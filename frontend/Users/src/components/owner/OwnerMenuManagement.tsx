import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jwtDecode } from "jwt-decode";

interface DishData {
  _id?: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  category?: string;
  imageFile?: File;
}

export default function OwnerMenuManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<DishData | null>(null);
  const [dishes, setDishes] = useState<DishData[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const rawToken =
    localStorage.getItem("owner_token") ||
    localStorage.getItem("token") ||
    "";
  const extractOwnerIdFromToken = (token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.owner_id || decoded.id || decoded.userId || decoded._id || "";
    } catch {
      return "";
    }
  };
  const ownerId =
    localStorage.getItem("owner_id") ||
    extractOwnerIdFromToken(rawToken);
  const [restaurantId, setRestaurantId] = useState("");
  const productBaseUrl =
    import.meta.env.VITE_PRODUCT_BASE_URL || import.meta.env.VITE_PRODUCT_API;
  const [formData, setFormData] = useState<DishData>({
    restaurant_id: "",
    name: "",
    description: "",
    price: 0,
    image_url: "",
    is_available: true,
  });

  // Fetch or create restaurant for this owner
  const ensureRestaurant = useCallback(async () => {
    if (!rawToken) {
      console.log("Missing token");
      return;
    }

    try {
      console.log("Fetching restaurant for current owner");
      // Get restaurant by owner token - using new /owner/me endpoint
      const res = await axios.get(
        `${productBaseUrl}/restaurants/owner/me`,
        {
          headers: { Authorization: `Bearer ${rawToken}` },
        }
      );

      console.log("Restaurant fetch response:", res.data);

      if (res.data?.success && res.data.data) {
        // Owner already has a restaurant
        const existingRestaurant = res.data.data;
        console.log("Found existing restaurant:", existingRestaurant);
        setRestaurantId(existingRestaurant._id);
        setFormData(prev => ({ ...prev, restaurant_id: existingRestaurant._id }));
        return;
      }
    } catch (error: any) {
      // If 404, owner doesn't have restaurant yet - will create on first dish add
      if (error.response?.status === 404) {
        console.log("No restaurant found for this owner");
        return;
      }
      
      console.error("Ensure restaurant error:", error);
      toast({
        title: "Unable to load restaurant",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    }
  }, [productBaseUrl, rawToken, toast]);

  const loadDishes = useCallback(async () => {
    if (!productBaseUrl || !restaurantId) {
      setDishes([]);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `${productBaseUrl}/dishes?restaurant_id=${restaurantId}`,
        {
          headers: { Authorization: `Bearer ${rawToken}` },
        }
      );

      setDishes(res.data?.data || []);
    } catch (error) {
      console.error("Load dishes error:", error);
      toast({
        title: "Unable to load dishes",
        description: "Please check the connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [productBaseUrl, restaurantId, rawToken, toast]);

  useEffect(() => {
    ensureRestaurant().then(() => {
      if (restaurantId) {
        loadDishes();
      }
    });
  }, [ensureRestaurant]);

  useEffect(() => {
    if (restaurantId) {
      loadDishes();
    }
  }, [restaurantId, loadDishes]);

  const resetForm = () => {
    setFormData({
      restaurant_id: restaurantId,
      name: "",
      description: "",
      price: 0,
      image_url: "",
      is_available: true,
      imageFile: undefined,
    });
    setPreviewUrl("");
    setEditingDish(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetRestaurantId = restaurantId || formData.restaurant_id;

    if (!productBaseUrl) {
      toast({ title: "Missing product service URL", variant: "destructive" });
      return;
    }

    // Auto-create restaurant if not exists
    if (!targetRestaurantId) {
      await ensureRestaurant();
      targetRestaurantId = restaurantId;
      
      if (!targetRestaurantId) {
        toast({ title: "Unable to create restaurant. Please try again.", variant: "destructive" });
        return;
      }
    }

    if (!formData.name.trim()) {
      toast({ title: "Please enter a dish name", variant: "destructive" });
      return;
    }

    if (formData.price <= 0) {
      toast({ title: "Price must be greater than 0", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const dishForm = new FormData();
      dishForm.append("restaurant_id", targetRestaurantId);
      dishForm.append("name", formData.name);
      dishForm.append("description", formData.description);
      dishForm.append("price", String(formData.price));
      dishForm.append("is_available", String(formData.is_available));
      if (formData.imageFile) {
        dishForm.append("image", formData.imageFile);
      }
      if (formData.image_url) {
        dishForm.append("image_url", formData.image_url);
      }

      if (editingDish) {
        await axios.put(
          `${productBaseUrl}/dishes/${editingDish._id}`,
          dishForm,
          {
            headers: {
              Authorization: `Bearer ${rawToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        toast({
          title: "Dish updated",
          description: `"${formData.name}" has been updated`,
        });
      } else {
        await axios.post(`${productBaseUrl}/dishes`, dishForm, {
          headers: {
            Authorization: `Bearer ${rawToken}`,
            "Content-Type": "multipart/form-data",
          },
        });

        alert("Added successfully");
      }

      resetForm();
      loadDishes();
    } catch (error: any) {
      console.error("Submit error:", error);

      if (error.response?.status === 409 || error.response?.data?.duplicate) {
        toast({
          title: "Dish already exists",
          description: "This dish is already in the menu",
          variant: "destructive",
        });
      } else if (error.response?.status === 401) {
        toast({
          title: "Authentication error",
          description: "Token is invalid or expired. Please login again.",
          variant: "destructive",
        });
      } else if (error.response?.status === 403) {
        toast({
          title: "Permission denied",
          description: error.response?.data?.message || "You cannot add dishes to this restaurant.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Unable to save dish",
          description: error.response?.data?.message || "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dish: DishData) => {
    setEditingDish(dish);
    setRestaurantId(dish.restaurant_id);
    setFormData({
      restaurant_id: dish.restaurant_id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      image_url: dish.image_url || "",
      is_available: dish.is_available,
      imageFile: undefined,
    });
    setPreviewUrl(dish.image_url || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (dishId: string) => {
    if (!productBaseUrl) return;
    if (!confirm("Are you sure you want to delete this dish?")) return;

    try {
      setLoading(true);
      await axios.delete(`${productBaseUrl}/dishes/${dishId}`, {
        headers: { Authorization: `Bearer ${rawToken}` },
      });
      toast({ title: "Dish deleted" });
      await loadDishes();
    } catch (error: any) {
      toast({
        title: "Failed to delete dish",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (dish: DishData) => {
    if (!productBaseUrl) return;

    try {
      setLoading(true);
      await axios.patch(
        `${productBaseUrl}/dishes/${dish._id}`,
        { is_available: !dish.is_available },
        {
          headers: { Authorization: `Bearer ${rawToken}` },
        }
      );
      toast({ title: "Status updated" });
      await loadDishes();
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Menu Items</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} data-testid="button-add-dish">
              <Plus className="h-4 w-4 mr-2" />
              Add Dish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDish ? "Edit Dish" : "Add New Dish"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Dish name"
                  required
                  data-testid="input-dish-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Dish description"
                  rows={3}
                  data-testid="input-dish-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">
                  Price (VND) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  placeholder="Price (e.g. 55000)"
                  required
                  data-testid="input-dish-price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, imageFile: file });
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  data-testid="input-dish-image"
                />
                <p className="text-xs text-gray-500">
                  Leave empty to keep the current image.
                </p>
                {(previewUrl || formData.image_url) && (
                  <div className="mt-2">
                    <img
                      src={previewUrl || formData.image_url}
                      alt="Preview"
                      className="w-full max-w-xs h-48 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/300x200?text=Invalid+URL";
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_available">Status</Label>
                <Select
                  value={formData.is_available ? "true" : "false"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, is_available: value === "true" })
                  }
                >
                  <SelectTrigger data-testid="select-dish-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Available</SelectItem>
                    <SelectItem value="false">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                data-testid="button-save-dish"
              >
                {loading ? "Processing..." : editingDish ? "Update Dish" : "Create Dish"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Dishes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : dishes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No dishes found
                  </TableCell>
                </TableRow>
              ) : (
                dishes.map((dish) => (
                  <TableRow key={dish._id} data-testid={`row-dish-${dish._id}`}>
                    <TableCell>
                      {dish.image_url ? (
                        <img
                          src={dish.image_url}
                          alt={dish.name}
                          loading="lazy"
                          className="w-16 h-16 object-cover rounded-lg shadow-sm bg-gray-100"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs"
                        style={{ display: dish.image_url ? 'none' : 'flex' }}
                      >
                        No Image
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {dish.name}
                    </TableCell>
                    <TableCell>{dish.category || "N/A"}</TableCell>
                    <TableCell>{dish.price.toLocaleString()} VND</TableCell>
                    <TableCell>
                      <Badge
                        variant={dish.is_available ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleAvailability(dish)}
                        data-testid={`badge-status-${dish._id}`}
                      >
                        {dish.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(dish)}
                          data-testid={`button-edit-${dish._id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(dish._id!)}
                          data-testid={`button-delete-${dish._id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
