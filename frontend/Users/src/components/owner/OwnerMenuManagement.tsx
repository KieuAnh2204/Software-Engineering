import { useState, useEffect } from "react";
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
import { getDishes, createDish, updateDish, deleteDish } from "@/api/ownerApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DishData {
  _id?: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  category?: string;
  imageFile?: File; // For file upload
}

export default function OwnerMenuManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<DishData | null>(null);
  const [dishes, setDishes] = useState<DishData[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DishData>({
    restaurant_id: "691938ab48990eb197f96549", // ID nhà hàng từ MongoDB
    name: "",
    description: "",
    price: 0,
    image_url: "",
    is_available: true,
  });

  // Load dishes khi component mount
  useEffect(() => {
    loadDishes();
  }, []);

  const loadDishes = async () => {
    try {
      setLoading(true);
      const response = await getDishes(formData.restaurant_id);
      setDishes(response.data.data || []);
    } catch (error: any) {
      console.error("Load dishes error:", error);
      toast({
        title: "Lỗi tải danh sách món ăn",
        description: error.response?.data?.message || "Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      restaurant_id: "691938ab48990eb197f96549",
      name: "",
      description: "",
      price: 0,
      image_url: "",
      is_available: true,
    });
    setEditingDish(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      toast({ title: "Vui lòng nhập tên món ăn", variant: "destructive" });
      return;
    }
    
    if (formData.price <= 0) {
      toast({ title: "Giá món ăn phải lớn hơn 0", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      
      const dishData = {
        restaurant_id: formData.restaurant_id,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        image_url: formData.image_url || undefined,
        is_available: formData.is_available,
      };
      
      if (editingDish) {
        // Update existing dish
        await updateDish(editingDish._id!, dishData);
        
        toast({
          title: "Cập nhật thành công",
          description: "Món ăn đã được cập nhật",
        });
      } else {
        // Create new dish
        const response = await createDish(dishData);
        
        if (response.data.success) {
          toast({
            title: "Tạo món ăn thành công",
            description: `Đã thêm món "${formData.name}"`,
          });
        }
      }
      
      resetForm();
      await loadDishes(); // Reload dishes
    } catch (error: any) {
      console.error("Submit error:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      
      // Kiểm tra lỗi trùng lặp
      if (error.response?.status === 409 || error.response?.data?.duplicate) {
        toast({
          title: "Món ăn đã tồn tại",
          description: "Món ăn này đã có trong menu nhà hàng",
          variant: "destructive",
        });
      } else if (error.response?.status === 401) {
        toast({
          title: "Lỗi xác thực",
          description: "Token hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại",
          variant: "destructive",
        });
      } else if (error.response?.status === 403) {
        toast({
          title: "Không có quyền",
          description: error.response?.data?.message || "Bạn không có quyền thêm món ăn cho nhà hàng này",
          variant: "destructive",
        });
      } else if (error.response?.status === 404) {
        toast({
          title: "Không tìm thấy nhà hàng",
          description: "Restaurant ID không tồn tại. Vui lòng kiểm tra lại",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Lỗi",
          description: error.response?.data?.message || error.message || "Vui lòng thử lại",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dish: DishData) => {
    setEditingDish(dish);
    setFormData({
      restaurant_id: dish.restaurant_id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      image_url: dish.image_url || "",
      is_available: dish.is_available,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (dishId: string) => {
    if (!confirm("Bạn có chắc muốn xóa món ăn này?")) return;

    try {
      setLoading(true);
      await deleteDish(dishId);
      toast({ title: "Đã xóa món ăn" });
      await loadDishes();
    } catch (error: any) {
      toast({
        title: "Lỗi xóa món ăn",
        description: error.response?.data?.message || "Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (dish: DishData) => {
    try {
      setLoading(true);
      await updateDish(dish._id!, { is_available: !dish.is_available });
      toast({ title: "Đã cập nhật trạng thái" });
      await loadDishes();
    } catch (error: any) {
      toast({
        title: "Lỗi cập nhật trạng thái",
        description: error.response?.data?.message || "Vui lòng thử lại",
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
                  placeholder="Tên món ăn (VD: Bún bò Huế)"
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
                  placeholder="Mô tả món ăn"
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
                  placeholder="Giá (VD: 55000)"
                  required
                  data-testid="input-dish-price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://i.imgur.com/example.jpg"
                  data-testid="input-dish-image"
                />
                <p className="text-xs text-gray-500">
                  💡 Tip: Upload ảnh lên{" "}
                  <a
                    href="https://imgur.com/upload"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    Imgur
                  </a>
                  {" "}và paste link vào đây
                </p>
                {formData.image_url && (
                  <div className="mt-2">
                    <img
                      src={formData.image_url}
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
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : dishes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No dishes found
                  </TableCell>
                </TableRow>
              ) : (
                dishes.map((dish) => (
                  <TableRow key={dish._id} data-testid={`row-dish-${dish._id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {dish.image_url && (
                          <img
                            src={dish.image_url}
                            alt={dish.name}
                            className="w-10 h-10 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        {dish.name}
                      </div>
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
