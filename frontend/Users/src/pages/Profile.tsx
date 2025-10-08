import { useState, useEffect } from "react";
import { ArrowLeft, Camera, MapPin, Phone, Mail, User as UserIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import { OrderStatusStepper } from "@/components/OrderStatusStepper";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user, isAuthenticated, setLocation]);

  const orderHistory = [
    {
      id: "#1234",
      date: "2025-01-15",
      restaurant: "Bella Italia",
      total: 42.97,
      status: "completed" as const,
    },
    {
      id: "#1235",
      date: "2025-01-18",
      restaurant: "Tokyo Fusion",
      total: 38.98,
      status: "completed" as const,
    },
    {
      id: "#1236",
      date: "2025-01-20",
      restaurant: "Burger House",
      total: 28.47,
      status: "delivering" as const,
    },
  ];

  const handleSave = () => {
    updateProfile({ name, email, phone, address });
    toast({
      title: "Profile updated",
      description: "Your changes have been saved successfully.",
    });
    setIsEditing(false);
  };

  const handleUploadAvatar = () => {
    console.log("Upload avatar clicked");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">My Profile</h1>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="info" data-testid="tab-info">
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              Order History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="" alt={name} />
                      <AvatarFallback className="text-2xl">
                        {name ? name.split(" ").map(n => n[0]).join("") : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                      onClick={handleUploadAvatar}
                      data-testid="button-upload-avatar"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{name}</h3>
                    <p className="text-sm text-muted-foreground">{email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle>Personal Information</CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    data-testid="button-edit"
                  >
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSave} data-testid="button-save">
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                    data-testid="input-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                    data-testid="input-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!isEditing}
                    data-testid="input-address"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            {orderHistory.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg">{order.id}</h3>
                        <Badge variant={order.status === "completed" ? "secondary" : "default"}>
                          {order.status === "completed" ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Restaurant:</span>{" "}
                        <span className="font-medium">{order.restaurant}</span>
                      </p>
                    </div>

                    {order.status !== "completed" && (
                      <div className="mt-4">
                        <OrderStatusStepper currentStatus={order.status} />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`button-view-details-${order.id}`}
                      onClick={() => console.log(`View order ${order.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`button-reorder-${order.id}`}
                      onClick={() => console.log(`Reorder ${order.id}`)}
                    >
                      Reorder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
