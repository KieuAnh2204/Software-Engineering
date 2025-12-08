import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  getRestaurantById,
  updateRestaurant,
  getOwnerRestaurants,
  uploadDishImage,
} from "@/api/ownerApi";

type Props = {
  restaurantId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RestaurantProfileDialog({ restaurantId, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [resolvedRestaurantId, setResolvedRestaurantId] = useState<string | undefined>(restaurantId);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    phone: "",
    address: "",
    logo_url: "",
  });
  const [originalForm, setOriginalForm] = useState({
    display_name: "",
    phone: "",
    address: "",
    logo_url: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const resolveRestaurantId = useCallback(async () => {
    if (!open) return;
    const stored =
      restaurantId ||
      localStorage.getItem("restaurant_id") ||
      localStorage.getItem("owner_restaurant_id") ||
      localStorage.getItem("restaurantId");
    if (stored) {
      setResolvedRestaurantId(stored);
      return stored;
    }

    const ownerId =
      localStorage.getItem("owner_id") || localStorage.getItem("ownerId") || "";
    if (!ownerId) return undefined;
    try {
      const res = await getOwnerRestaurants(ownerId);
      const first =
        res.data?.data?.[0]?._id ||
        res.data?.data?.[0]?.id ||
        res.data?.[0]?._id ||
        res.data?.[0]?.id;
      if (first) {
        setResolvedRestaurantId(first);
        localStorage.setItem("restaurant_id", first);
        localStorage.setItem("owner_restaurant_id", first);
        localStorage.setItem("restaurantId", first);
        return first;
      }
    } catch (err) {
      console.error("resolveRestaurantId failed:", err);
    }
    return undefined;
  }, [restaurantId, open]);

  const loadRestaurant = useCallback(async () => {
    if (!open) return;
    const id = await resolveRestaurantId();
    if (!id) return;
    try {
      setLoading(true);
      const res = await getRestaurantById(id);
      const data = res.data?.data || res.data || {};
      setForm({
        display_name: data.display_name || data.name || "",
        phone: data.phone || "",
        address: data.address || "",
        logo_url: data.logo_url || "",
      });
      setOriginalForm({
        display_name: data.display_name || data.name || "",
        phone: data.phone || "",
        address: data.address || "",
        logo_url: data.logo_url || "",
      });
      setLogoPreview(data.logo_url || "");
    } catch (error: any) {
      console.error("Load restaurant failed:", error);
      toast({
        title: "Không tải được thông tin nhà hàng",
        description: error?.response?.data?.message || "Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [restaurantId, open, toast]);

  useEffect(() => {
    loadRestaurant();
    setEditing(false);
  }, [loadRestaurant]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setLogoPreview(String(ev.target.result));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!editing) {
      setEditing(true);
      return;
    }
    const id = resolvedRestaurantId || (await resolveRestaurantId());
    if (!id) {
      toast({ title: "Không tìm thấy nhà hàng", description: "Hãy đảm bảo bạn đã tạo nhà hàng.", variant: "destructive" });
      return;
    }
    if (!form.display_name || !form.phone || !form.address) {
      toast({ title: "Vui lòng nhập đủ tên, số điện thoại và địa chỉ", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      let logoUrl = form.logo_url;
      if (logoFile) {
        const fd = new FormData();
        fd.append("image", logoFile);
        const uploadRes = await uploadDishImage(fd);
        logoUrl = uploadRes.data?.image_url || logoUrl;
        setLogoPreview(logoUrl || logoPreview);
        setForm((prev) => ({ ...prev, logo_url: logoUrl }));
      }

      await updateRestaurant(id, {
        name: form.display_name || form.address || "Restaurant",
        display_name: form.display_name,
        phone: form.phone,
        address: form.address,
        logo_url: logoUrl,
      });

      toast({ title: "Đã cập nhật thông tin nhà hàng" });
      setOriginalForm({
        display_name: form.display_name,
        phone: form.phone,
        address: form.address,
        logo_url: logoUrl,
      });
      setEditing(false);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Update restaurant failed:", error);
      toast({
        title: "Không thể lưu",
        description: error?.response?.data?.message || "Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Thông tin nhà hàng</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display_name">Tên hiển thị</Label>
              <Input
                id="display_name"
                value={form.display_name}
                disabled={!editing || loading || saving}
                onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
                placeholder="My Restaurant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={form.phone}
                disabled={!editing || loading || saving}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="0123456789"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              value={form.address}
              disabled={!editing || loading || saving}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="123 Đường ABC, Quận 1"
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg border overflow-hidden bg-muted">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                    No logo
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Input type="file" accept="image/*" onChange={handleFileChange} disabled={!editing || saving} />
              </div>
            </div>
          </div>
        <div className="flex justify-end gap-3 pt-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setForm(originalForm);
                  setLogoPreview(originalForm.logo_url);
                  setEditing(false);
                }}
                disabled={saving}
              >
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={saving || loading}>
                Lưu thay đổi
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
              <Button onClick={() => setEditing(true)}>Chỉnh sửa</Button>
            </>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
