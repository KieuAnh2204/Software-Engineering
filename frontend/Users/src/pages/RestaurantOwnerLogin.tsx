import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRestaurantOwnerAuth } from "@/contexts/RestaurantOwnerAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Store } from "lucide-react";

export default function RestaurantOwnerLogin() {
  const [, setLocation] = useLocation();
  const { ownerLogin } = useRestaurantOwnerAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ownerLogin(username, password);
      toast({
        title: "Login successful",
        description: "Welcome to your restaurant portal",
      });
      setLocation("/owner");
    } catch (error: any) {
      const code = error?.code;
      const description =
        code === "OWNER_NOT_APPROVED"
          ? "Your account is pending admin approval."
          : code === "ACCOUNT_DEACTIVATED"
          ? "Your account has been deactivated."
          : "Invalid credentials";
      toast({
        title: "Login failed",
        description,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Restaurant Owner Portal</CardTitle>
          <CardDescription>Sign in to manage your restaurant</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Email</Label>
              <Input
                id="username"
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                data-testid="input-owner-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-owner-password"
              />
            </div>
            <Button type="submit" className="w-full" data-testid="button-owner-login">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
