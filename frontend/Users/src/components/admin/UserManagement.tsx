import { useMemo, useState } from "react";
import { Search, MoreVertical, Ban, CheckCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Customer = {
  _id: string;
  full_name?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  user?: {
    _id: string;
    email?: string;
    username?: string;
    isActive?: boolean;
    createdAt?: string;
  };
};

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{
    success?: boolean;
    data?: Customer[];
  }>({
    queryKey: ["/api/admin/users/customers"],
  });

  const customers = useMemo(() => data?.data || [], [data]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/users/${id}/active`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/customers"] });
      toast({
        title: "Success",
        description: "User status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const filtered = customers.filter((c) => {
    const name = c.full_name || c.user?.username || "";
    const email = c.user?.email || "";
    const phone = c.phone || "";
    const q = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-users"
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((customer) => {
                const joinDate = customer.createdAt || customer.user?.createdAt;
                const displayName = customer.full_name || customer.user?.username || "N/A";
                const email = customer.user?.email || "N/A";
                const isActive = customer.user?.isActive !== false;
                return (
                  <TableRow key={customer._id}>
                    <TableCell className="font-medium">{displayName}</TableCell>
                    <TableCell>{email}</TableCell>
                    <TableCell>{customer.phone || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.address || "N/A"}</TableCell>
                    <TableCell>
                      {joinDate ? new Date(joinDate).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-user-menu-${customer._id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: customer._id,
                                isActive: !isActive,
                              })
                            }
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            {isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
            );
          })
        )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
