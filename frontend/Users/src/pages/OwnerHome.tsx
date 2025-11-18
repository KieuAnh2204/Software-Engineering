import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useOwnerAuth } from "@/hooks/useOwnerAuth";
import { Store, Plus, AlertCircle } from "lucide-react";

export default function OwnerHome() {
  const [, setLocation] = useLocation();
  const { owner, isAuthenticated, logout } = useOwnerAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/owner/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated || !owner) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500">Pending Approval</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "SUSPENDED":
        return <Badge className="bg-gray-500">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {owner.name}!</h1>
          <p className="text-muted-foreground">
            Manage your restaurant account
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Current Status
                  </div>
                  {getStatusBadge(owner.status)}
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Email
                  </div>
                  <div className="font-medium">{owner.email}</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Username
                  </div>
                  <div className="font-medium">{owner.username}</div>
                </div>

                {owner.status === "PENDING" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        Your account is pending admin approval. You can create
                        your restaurant now, but it won't be visible to customers
                        until your account is approved.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with your restaurant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/owner/restaurant/new">
                <Button className="w-full" size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Restaurant
                </Button>
              </Link>

              <Link href="/owner/dashboard">
                <Button variant="outline" className="w-full" size="lg">
                  Go to Dashboard
                </Button>
              </Link>

              <Button
                variant="ghost"
                className="w-full"
                onClick={logout}
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
