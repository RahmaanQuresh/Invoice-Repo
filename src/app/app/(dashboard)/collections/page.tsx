"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Scale,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  ArrowUpRight,
  Clock,
  Gavel,
  FileWarning,
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

interface CollectionsInvoice {
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
  legalStatus: string;
  legalEscalationId: string | null;
}

function CollectionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [invoices, setInvoices] = useState<CollectionsInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all") {
        if (statusFilter === "collections") {
          params.set("status", "overdue");
          params.set("overdueMin", "30");
        } else if (statusFilter === "legal") {
          params.set("status", "overdue");
          params.set("hasLegal", "true");
        } else {
          params.set("status", statusFilter);
        }
      }

      const res = await fetch(`/api/invoices/collections?${params}`);
      const data = await res.json();
      if (res.ok) {
        setInvoices(
          (data.data || []).map((inv: any) => ({
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
            legalStatus: inv.legalEscalation?.status || "not_started",
            legalEscalationId: inv.legalEscalation?.id || null,
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const getOverdueBadge = (days: number) => {
    if (days >= 90) return { label: `${days}d (Final Notice)`, variant: "destructive" as const };
    if (days >= 60) return { label: `${days}d (Collections)`, variant: "default" as const };
    if (days >= 30) return { label: `${days}d (Aging)`, variant: "secondary" as const };
    return { label: `${days}d`, variant: "outline" as const };
  };

  const getLegalStatusBadge = (status: string) => {
    switch (status) {
      case "letter_generated":
      case "letter_sent":
        return { label: "Letter Sent", variant: "warning" as const };
      case "small_claims_guide_generated":
        return { label: "Guide Ready", variant: "default" as const };
      case "resolved":
        return { label: "Resolved", variant: "success" as const };
      case "paused":
        return { label: "Paused", variant: "secondary" as const };
      default:
        return { label: "Not Started", variant: "outline" as const };
    }
  };

  // Stats
  const inCollections = invoices.filter((i) => i.daysOverdue >= 30).length;
  const inLegal = invoices.filter((i) => i.legalStatus !== "not_started" && i.legalStatus !== "canceled").length;
  const finalNotices = invoices.filter((i) => i.daysOverdue >= 90).length;
  const totalOutstanding = invoices.reduce((sum, i) => sum + i.total, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Collections</h1>
          <p className="text-muted-foreground">
            Manage overdue invoices and legal escalation
          </p>
        </div>
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Collections</h1>
        <p className="text-muted-foreground">
          Manage overdue invoices and legal escalation
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {formatCurrency(totalOutstanding)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              In Collections (30d+)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-2xl font-bold">{inCollections}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Final Notice (90d+)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">{finalNotices}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Legal Process</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-purple-500" />
              <span className="text-2xl font-bold">{inLegal}</span>
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
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Overdue</SelectItem>
            <SelectItem value="collections">Collections (30d+)</SelectItem>
            <SelectItem value="90">Final Notice (90d+)</SelectItem>
            <SelectItem value="legal">Legal Process</SelectItem>
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
              <TableHead>Amount</TableHead>
              <TableHead>Overdue</TableHead>
              <TableHead>Reminders</TableHead>
              <TableHead>Legal Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  No invoices in collections
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => {
                const badge = getOverdueBadge(invoice.daysOverdue);
                return (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(
                        invoice.legalEscalationId
                          ? `/app/invoices/${invoice.id}/legal`
                          : `/app/invoices/${invoice.id}`
                      )
                    }
                  >
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {invoice.currentReminderStep}/{invoice.totalSteps} steps
                        {invoice.reminderPaused && " (paused)"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLegalStatusBadge(invoice.legalStatus).variant}>
                        {getLegalStatusBadge(invoice.legalStatus).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/app/invoices/${invoice.id}/legal`);
                        }}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Collections</h1>
            <p className="text-muted-foreground">
              Manage overdue invoices and legal escalation
            </p>
          </div>
          <LoadingSkeleton rows={5} />
        </div>
      }
    >
      <CollectionsContent />
    </Suspense>
  );
}
