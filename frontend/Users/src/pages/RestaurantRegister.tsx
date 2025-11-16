import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";
import { useOwnerAuth } from "@/hooks/useOwnerAuth";
import { useToast } from "@/hooks/use-toast";
import { createRestaurant } from "@/api/ownerApi";

export default function RestaurantRegister() {
  const [, setLocation] = useLocation();
  const { ownerId, isAuthenticated } = useOwnerAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [logoUrl, setLogoUrl] = useState("");

  // Redirect if not authenticated
  if (!isAuthenticated || !ownerId) {
    setLocation("/owner/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ownerId) {
      toast({
        title: "Error",
        description: "Owner ID not found. Please login again.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createRestaurant({
        owner_id: ownerId,
        name,
        description,
        phone,
        address,
        logo_url: logoUrl || undefined,
        open_time: openTime,
        close_time: closeTime,
      });

      toast({
        title: "Restaurant created",
        description: "Your restaurant has been registered successfully!",
      });
      setLocation("/owner/dashboard");
    } catch (error: any) {
      toast({
        title: "Creation failed",
        description: error?.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/owner/home">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Register Restaurant</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your Restaurant</CardTitle>
            <CardDescription>
              Fill in your restaurant details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="My Amazing Restaurant"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-testid="input-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell customers about your restaurant..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  data-testid="input-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0909123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  data-testid="input-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Main Street, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  data-testid="input-address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="open-time">Open Time</Label>
                  <Input
                    id="open-time"
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    required
                    data-testid="input-open-time"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="close-time">Close Time</Label>
                  <Input
                    id="close-time"
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    required
                    data-testid="input-close-time"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo-url">Logo URL (optional)</Label>
                <Input
                  id="logo-url"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  data-testid="input-logo-url"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                data-testid="button-create"
              >
                Create Restaurant
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
