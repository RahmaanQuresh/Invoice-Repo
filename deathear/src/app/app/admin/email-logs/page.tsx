"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate } from "@/lib/utils";
import { Search } from "lucide-react";

interface EmailLog {
  id: string;
  type: string;
  email: string;
  subject: string;
  deliveryStatus: string;
  createdAt: string;
  errorMessage: string | null;
}

export default function AdminEmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");  useEffect(() => {
	    loadLogs();
	    // eslint-disable-next-line react-hooks/exhaustive-deps
	  }, []);
	
	  const loadLogs = async () => {
    try {
      const res = await fetch(`/api/admin/email-logs?search=${search}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch {
      console.error("Failed to load email logs");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <TableSkeleton />;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "delivered": return "default";
      case "opened": return "default";
      case "bounced": return "destructive";
      case "sent": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Logs</h1>
        <p className="mt-2 text-muted-foreground">View email delivery history.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && loadLogs()}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Logs ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">To</th>
                  <th className="pb-3 font-medium">Subject</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Error</th>
                  <th className="pb-3 font-medium">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-3">
                      <Badge variant="outline">{log.type}</Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">{log.email}</td>
                    <td className="py-3 max-w-[300px] truncate">{log.subject}</td>
                    <td className="py-3">
                      <Badge variant={getStatusVariant(log.deliveryStatus)}>
                        {log.deliveryStatus}
                      </Badge>
                    </td>
                    <td className="py-3 text-xs text-destructive max-w-[200px] truncate">
                      {log.errorMessage || "—"}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No email logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
