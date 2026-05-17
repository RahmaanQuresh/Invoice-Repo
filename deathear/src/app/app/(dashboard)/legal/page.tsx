"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Scale,
  Gavel,
  FileText,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  XCircle,
  Clock,
  FileWarning,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

interface LegalEscalationItem {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  formalLetterSentAt: string | null;
  invoice: {
    id: string;
    invoiceNumber: string;
    total: number;
    status: string;
    dueDate: string;
    clientName: string;
    daysOverdue: number;
  };
}

interface LegalStats {
  total: number;
  active: number;
  letterSent: number;
  guideReady: number;
  resolved: number;
  totalOutstanding: number;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "letter_generated":
    case "letter_sent":
      return { label: status === "letter_sent" ? "Letter Sent" : "Letter Generated", variant: "warning" as const };
    case "small_claims_guide_generated":
      return { label: "Guide Ready", variant: "default" as const };
    case "resolved":
      return { label: "Resolved", variant: "success" as const };
    case "paused":
      return { label: "Paused", variant: "secondary" as const };
    case "canceled":
      return { label: "Canceled", variant: "secondary" as const };
    default:
      return { label: "Not Started", variant: "outline" as const };
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "resolved":
      return CheckCircle2;
    case "letter_generated":
    case "letter_sent":
      return FileText;
    case "small_claims_guide_generated":
      return BookOpen;
    case "paused":
    case "canceled":
      return XCircle;
    default:
      return AlertTriangle;
  }
};

function LegalOverviewContent() {
  const router = useRouter();
  const [items, setItems] = useState<LegalEscalationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLegalCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/legal");
      const data = await res.json();
      if (res.ok) {
        setItems(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLegalCases();
  }, [fetchLegalCases]);

  const stats: LegalStats = {
    total: items.length,
    active: items.filter((i) => i.status !== "resolved" && i.status !== "canceled" && i.status !== "not_started").length,
    letterSent: items.filter((i) => i.status === "letter_generated" || i.status === "letter_sent").length,
    guideReady: items.filter((i) => i.status === "small_claims_guide_generated").length,
    resolved: items.filter((i) => i.status === "resolved").length,
    totalOutstanding: items.reduce((sum, i) => sum + i.invoice.total, 0),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Legal Escalation</h1>
          <p className="text-muted-foreground">
            Manage formal demand letters and small claims guides
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Legal Escalation</h1>
        <p className="text-muted-foreground">
          Manage formal demand letters, small claims guides, and track legal case progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-amber-500" />
              <span className="text-2xl font-bold">{stats.active}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Letters Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{stats.letterSent}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.resolved}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Scale className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No legal cases yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Legal escalation becomes available for invoices that are 90+ days overdue. 
              Head to the Collections page to manage overdue invoices and start the legal process.
            </p>
            <Button onClick={() => router.push("/app/collections")}>
              Go to Collections
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Process Overview Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-sm font-medium">Step 1: Demand Letter</CardTitle>
                </div>
                <CardDescription>
                  Generate a formal demand letter for overdue invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {stats.letterSent} of {stats.active} active cases have letters
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-sm font-medium">Step 2: Small Claims Guide</CardTitle>
                </div>
                <CardDescription>
                  Generate jurisdiction-specific small claims guidance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {stats.guideReady} of {stats.active} active cases have guides
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-sm font-medium">Step 3: Resolution</CardTitle>
                </div>
                <CardDescription>
                  Mark cases as resolved once payment is collected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {stats.resolved} cases resolved
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cases Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Overdue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const badge = getStatusBadge(item.status);
                  const Icon = getStatusIcon(item.status);
                  return (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/app/invoices/${item.invoice.id}/legal`)
                      }
                    >
                      <TableCell className="font-medium">
                        {item.invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{item.invoice.clientName}</TableCell>
                      <TableCell>
                        {formatCurrency(item.invoice.total)}
                      </TableCell>
                      <TableCell>
                        {item.invoice.daysOverdue > 0 ? (
                          <span className="text-sm text-muted-foreground">
                            {item.invoice.daysOverdue}d
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>
                          <Icon className="w-3 h-3 mr-1 inline" />
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/app/invoices/${item.invoice.id}/legal`
                            );
                          }}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

export default function LegalOverviewPage() {
  return <LegalOverviewContent />;
}
