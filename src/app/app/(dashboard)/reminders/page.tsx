"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  PauseCircle,
  PlayCircle,
  Loader2,
  Search,
  AlertTriangle,
  Calendar,
  ChevronDown,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ReminderInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  status: string;
  dueDate: string;
  daysOverdue: number;
  reminderEnabled: boolean;
  reminderPaused: boolean;
  currentReminderStep: number;
  totalSteps: number;
  nextReminderDate: string | null;
  lastReminderSent: string | null;
  deliveryStatus: string | null;
}

function RemindersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [invoices, setInvoices] = useState<ReminderInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/invoices?id=needs-attention&${params}`);
      const data = await res.json();
      if (res.ok) {
        const mapped = (data.data || []).map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.client?.name || inv.clientName || "Unknown",
          total: inv.total,
          status: inv.status,
          dueDate: inv.dueDate,
          daysOverdue: Math.max(
            0,
            Math.floor(
              (new Date().getTime() - new Date(inv.dueDate).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          ),
          reminderEnabled: inv.reminderEnabled ?? false,
          reminderPaused: inv.reminderPaused ?? false,
          currentReminderStep: inv.currentReminderStep ?? 0,
          totalSteps: JSON.parse(inv.reminderSequence || "[]").length,
          nextReminderDate: inv.nextReminderDate || null,
          lastReminderSent:
            inv.reminders?.[0]?.sentAt || null,
          deliveryStatus:
            inv.reminders?.[0]?.deliveryStatus || null,
        }));
        setInvoices(mapped);
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const toggleReminder = async (id: string) => {
    setToggling(id);
    try {
      const invoice = invoices.find((i) => i.id === id);
      if (!invoice) return;
      await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderEnabled: !invoice.reminderEnabled,
        }),
      });
      await fetchReminders();
    } finally {
      setToggling(null);
    }
  };

  // Stats
  const activeReminders = invoices.filter((i) => i.reminderEnabled && !i.reminderPaused).length;
  const pausedReminders = invoices.filter((i) => i.reminderPaused).length;
  const overdueCount = invoices.filter((i) => i.daysOverdue > 0).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reminders</h1>
          <p className="text-muted-foreground">
            Automated payment reminders for overdue invoices
          </p>
        </div>
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reminders</h1>
          <p className="text-muted-foreground">
            Automated payment reminders for overdue invoices
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-purple-500" />
              <span className="text-2xl font-bold">{activeReminders}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <PauseCircle className="h-4 w-4 text-amber-500" />
              <span className="text-2xl font-bold">{pausedReminders}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">{overdueCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">
                {invoices.filter((i) => {
                  if (!i.nextReminderDate || !i.reminderEnabled || i.reminderPaused) return false;
                  const next = new Date(i.nextReminderDate);
                  const today = new Date();
                  return next.toDateString() === today.toDateString();
                }).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoices or clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reminders</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Overdue</TableHead>
              <TableHead>Step</TableHead>
              <TableHead>Next Reminder</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No reminders configured
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/app/invoices/${invoice.id}`)}
                >
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {invoice.reminderEnabled ? (
                        invoice.reminderPaused ? (
                          <PauseCircle className="h-3 w-3 text-amber-500" />
                        ) : (
                          <Bell className="h-3 w-3 text-purple-500" />
                        )
                      ) : (
                        <BellOff className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-xs">
                        {invoice.reminderPaused
                          ? "Paused"
                          : invoice.reminderEnabled
                            ? "Active"
                            : "Disabled"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {invoice.daysOverdue > 0 ? (
                      <Badge
                        variant="secondary"
                        className={
                          invoice.daysOverdue > 30
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            : invoice.daysOverdue > 14
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                              : ""
                        }
                      >
                        {invoice.daysOverdue}d
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">
                      {invoice.currentReminderStep}/{invoice.totalSteps}
                    </span>
                  </TableCell>
                  <TableCell>
                    {invoice.nextReminderDate ? (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(invoice.nextReminderDate)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleReminder(invoice.id);
                      }}
                      disabled={toggling === invoice.id}
                    >
                      {toggling === invoice.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : invoice.reminderEnabled ? (
                        <BellOff className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function RemindersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Reminders</h1>
            <p className="text-muted-foreground">
              Automated payment reminders for overdue invoices
            </p>
          </div>
          <LoadingSkeleton rows={5} />
        </div>
      }
    >
      <RemindersContent />
    </Suspense>
  );
}
