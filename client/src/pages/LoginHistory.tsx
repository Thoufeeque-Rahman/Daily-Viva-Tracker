import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Header from "@/components/Header";
import { useLocation } from "wouter";
import axios from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clock3, Globe, Laptop } from "lucide-react";

interface LoginHistoryEntry {
  _id: string;
  loginAt: string;
  logoutAt?: string;
  ipAddress?: string;
  userAgent?: string;
  authMethod?: "email" | "username" | "email_or_username";
  isActive: boolean;
}

function formatAuthMethod(value?: LoginHistoryEntry["authMethod"]): string {
  if (!value) {
    return "Unknown";
  }

  if (value === "email_or_username") {
    return "Email or Username";
  }

  return value === "email" ? "Email" : "Username";
}

export default function LoginHistoryPage() {
  const [, navigate] = useLocation();
  const [entries, setEntries] = useState<LoginHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHistory = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await axios.get("/api/teachers/login-history/me");
      setEntries(response.data || []);
    } catch (error) {
      console.error("Failed to fetch login history:", error);
      setEntries([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const activeCount = useMemo(
    () => entries.filter((entry) => entry.isActive).length,
    [entries]
  );

  return (
    <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg relative h-full flex flex-col">
      <Header
        showContext={false}
        onHomeClick={() => navigate("/")}
        selectedClass={undefined}
        selectedSubject={undefined}
      />

      <main className="flex-1 p-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Login History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground">
                Total sessions: <span className="font-semibold text-foreground">{entries.length}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Active: <span className="font-semibold text-foreground">{activeCount}</span>
              </div>
            </div>
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => loadHistory(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading login history...</div>
            ) : entries.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No login history found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry._id}>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm">
                            <Clock3 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {format(new Date(entry.loginAt), "dd MMM yyyy, hh:mm a")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {entry.logoutAt
                                  ? `Logout: ${format(new Date(entry.logoutAt), "dd MMM yyyy, hh:mm a")}`
                                  : "Logout: ongoing"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Globe className="h-3.5 w-3.5" />
                            <span>{entry.ipAddress || "IP unavailable"}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Laptop className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[180px]" title={entry.userAgent || "N/A"}>
                              {entry.userAgent || "User agent unavailable"}
                            </span>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Method: {formatAuthMethod(entry.authMethod)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.isActive ? "default" : "secondary"}>
                          {entry.isActive ? "Active" : "Closed"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
