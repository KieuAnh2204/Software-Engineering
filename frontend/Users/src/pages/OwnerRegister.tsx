import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { registerOwner } from "@/api/ownerApi";
import { useToast } from "@/hooks/use-toast";

export default function OwnerRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [full_name, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await registerOwner({
        email,
        password,
        username,
        full_name,
        phone,
        ...(logoUrl && { logo_url: logoUrl }), // Only include if not empty
      });
      
      // Save token and owner_id to localStorage
      // Backend returns: { success, message, user, token }
      const { token, user } = response.data;
      if (token && user) {
        localStorage.setItem("owner_token", token);
        localStorage.setItem("owner_id", user._id);
      }
      
      toast({
        title: "Registration successful",
        description: "Now create your restaurant!",
      });
      
      setLocation("/owner/create-restaurant");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error?.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Register as Owner</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Owner Account</CardTitle>
            <CardDescription>
              Register your restaurant owner account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="BunMamBacLieu@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="input-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="owner01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="owner2204"
                  value={full_name}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  data-testid="input-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  data-testid="input-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL (Optional)</Label>
                <Input
                  id="logo_url"
                  type="url"
                  placeholder="https://example/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  data-testid="input-logo-url"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                data-testid="button-register"
              >
                Create Owner Account
              </Button>

              <div className="text-center text-sm text-muted-foreground mt-4">
                Already have an account?{" "}
                <Link href="/owner/login" className="text-primary hover:underline">
                  Login here
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
