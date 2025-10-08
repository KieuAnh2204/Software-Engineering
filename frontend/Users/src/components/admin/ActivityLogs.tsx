import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import type { ActivityLog } from "@shared/schema";
import { format } from "date-fns";

const actionColors = {
  CREATE_DISH: "default",
  UPDATE_DISH: "secondary",
  DELETE_DISH: "outline",
  TOGGLE_DISH_AVAILABILITY: "secondary",
  UPDATE_ORDER_STATUS: "default",
  UPDATE_RESTAURANT_STATUS: "secondary",
} as const;

export default function ActivityLogs() {
  const [userFilter, setUserFilter] = useState("");

  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/admin/activity-logs"],
  });

  const filteredLogs = logs.filter((log) =>
    userFilter ? log.username.toLowerCase().includes(userFilter.toLowerCase()) : true
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Restaurant Owner Activity Logs</h2>
        <div className="w-64">
          <Label htmlFor="user-filter">Filter by User</Label>
          <Input
            id="user-filter"
            placeholder="Enter username..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            data-testid="input-filter-user"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Activity ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No activity logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                    <TableCell>
                      {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell className="font-medium">{log.username}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          actionColors[log.action as keyof typeof actionColors] ||
                          "secondary"
                        }
                        data-testid={`badge-action-${log.id}`}
                      >
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {log.details || "N/A"}
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
