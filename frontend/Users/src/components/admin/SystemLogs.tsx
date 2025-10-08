import { useState } from "react";
import { Search, Download, AlertCircle, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

type LogLevel = "info" | "warning" | "error" | "success";

interface Log {
  id: string;
  timestamp: string;
  level: LogLevel;
  action: string;
  user: string;
  details: string;
}

export default function SystemLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");

  const logs: Log[] = [
    { id: "1", timestamp: "2025-01-20 15:30:45", level: "info", action: "User Login", user: "admin", details: "Admin logged in successfully" },
    { id: "2", timestamp: "2025-01-20 15:28:12", level: "success", action: "Order Completed", user: "system", details: "Order #1239 marked as completed" },
    { id: "3", timestamp: "2025-01-20 15:25:33", level: "warning", action: "Low Stock", user: "system", details: "Menu item 'Sushi Platter' running low on stock" },
    { id: "4", timestamp: "2025-01-20 15:22:18", level: "info", action: "Restaurant Added", user: "admin", details: "New restaurant 'Pizza Palace' added to system" },
    { id: "5", timestamp: "2025-01-20 15:20:05", level: "error", action: "Payment Failed", user: "system", details: "Payment processing failed for order #1240" },
    { id: "6", timestamp: "2025-01-20 15:15:44", level: "info", action: "Menu Updated", user: "admin", details: "Menu item 'Classic Burger' price updated" },
    { id: "7", timestamp: "2025-01-20 15:10:22", level: "success", action: "User Registered", user: "system", details: "New user 'alice@example.com' registered" },
    { id: "8", timestamp: "2025-01-20 15:05:11", level: "warning", action: "High Traffic", user: "system", details: "Server experiencing high traffic" },
  ];

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case "error": return <AlertCircle className="h-4 w-4" />;
      case "warning": return <AlertTriangle className="h-4 w-4" />;
      case "success": return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case "error": return "text-red-500";
      case "warning": return "text-yellow-500";
      case "success": return "text-green-500";
      default: return "text-blue-500";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-logs"
            />
          </div>
          <div className="w-48">
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger data-testid="select-filter-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline" data-testid="button-export-logs">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      <Card className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-md border bg-card hover-elevate"
                data-testid={`log-entry-${log.id}`}
              >
                <div className={`mt-0.5 ${getLevelColor(log.level)}`}>
                  {getLevelIcon(log.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium">{log.action}</span>
                    <Badge variant="outline" className="text-xs">
                      {log.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{log.details}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{log.timestamp}</span>
                    <span>•</span>
                    <span>by {log.user}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
