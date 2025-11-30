import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search, CheckCircle2, XCircle, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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

type Owner = {
  _id: string;
  display_name?: string;
  phone?: string;
  address?: string;
  status?: string;
  user?: {
    _id: string;
    email?: string;
    username?: string;
  };
  createdAt?: string;
};

const STATUS_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  APPROVED: "default",
  PENDING: "secondary",
  REJECTED: "destructive",
  SUSPENDED: "outline",
};

export default function OwnerApprovals() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery<{ data?: Owner[] }>({
    queryKey: ["/api/admin/users/owners"],
  });

  const owners = useMemo(() => data?.data || [], [data]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/users/owners/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/owners"] });
      toast({ title: "Success", description: "Owner status updated" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update owner status",
        variant: "destructive",
      });
    },
  });

  const filtered = owners.filter((owner) => {
    const name = owner.display_name || owner.user?.username || "";
    const email = owner.user?.email || "";
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search owners..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-owners"
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
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No owners found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((owner) => {
                const status = owner.status || "PENDING";
                return (
                  <TableRow key={owner._id}>
                    <TableCell className="font-medium">
                      {owner.display_name || owner.user?.username || "N/A"}
                    </TableCell>
                    <TableCell>{owner.user?.email || "N/A"}</TableCell>
                    <TableCell>{owner.phone || "N/A"}</TableCell>
                    <TableCell className="max-w-xs truncate">{owner.address || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[status] || "secondary"}>{status}</Badge>
                    </TableCell>
                    <TableCell>
                      {owner.createdAt ? new Date(owner.createdAt).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-owner-menu-${owner._id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              statusMutation.mutate({ id: owner._id, status: "APPROVED" })
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              statusMutation.mutate({ id: owner._id, status: "REJECTED" })
                            }
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
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
