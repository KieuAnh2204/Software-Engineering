import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";
import { createRestaurant } from "@/api/ownerApi";
import { useToast } from "@/hooks/use-toast";

export default function OwnerCreateRestaurant() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("22:00");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get owner_id from localStorage
    const ownerId = localStorage.getItem("owner_id");
    if (!ownerId) {
      toast({
        title: "Error",
        description: "Owner ID not found. Please register again.",
        variant: "destructive",
      });
      setLocation("/owner/register");
      return;
    }

    try {
      await createRestaurant({
        owner_id: ownerId,
        name,
        description,
        address,
        phone,
        open_time: openTime,
        close_time: closeTime,
      });

      toast({
        title: "Restaurant created successfully!",
        description: "Now you can login to manage your restaurant.",
      });

      setLocation("/owner/login");
    } catch (error: any) {
      toast({
        title: "Failed to create restaurant",
        description: error?.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/owner/register">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create Restaurant</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Restaurant Information</CardTitle>
            <CardDescription>
              Fill in your restaurant details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Pizza House"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Best pizza in town"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Nguyen Hue, District 1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0909999999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="open_time">Open Time</Label>
                  <Input
                    id="open_time"
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="close_time">Close Time</Label>
                  <Input
                    id="close_time"
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Create Restaurant
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
