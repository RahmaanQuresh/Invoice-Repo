"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Scale,
  FileText,
  Download,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Send,
  Gavel,
  BookOpen,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface LegalPageData {
  invoice: {
    id: string;
    invoiceNumber: string;
    clientName: string;
    total: number;
    status: string;
    dueDate: string;
    daysOverdue: number;
  };
  legalEscalation: {
    id: string;
    status: string;
    formalLetterContent: string | null;
    formalLetterSentAt: string | null;
    smallClaimsGuideContent: string | null;
    smallClaimsGuideState: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export default function LegalPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<LegalPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoiceRes, legalRes] = await Promise.all([
          fetch(`/api/invoices/${params.id}`),
          fetch(`/api/legal/${params.id}`),
        ]);
        const invoiceData = await invoiceRes.json();
        const legalData = legalRes.ok ? await legalRes.json() : { data: null };

        setData({
          invoice: {
            id: invoiceData.data.id,
            invoiceNumber: invoiceData.data.invoiceNumber,
            clientName: invoiceData.data.client?.name || "Unknown",
            total: invoiceData.data.total,
            status: invoiceData.data.status,
            dueDate: invoiceData.data.dueDate,
            daysOverdue: Math.max(
              0,
              Math.floor(
                (new Date().getTime() -
                  new Date(invoiceData.data.dueDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            ),
          },
          legalEscalation: legalData.data || null,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const generateLetter = async () => {
    setGeneratingLetter(true);
    try {
      const res = await fetch("/api/legal/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: params.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || "Failed to generate letter");
      // Refetch to show the generated letter
      const legalRes = await fetch(`/api/legal/${params.id}`);
      const legalData = await legalRes.json();
      setData((prev) =>
        prev ? { ...prev, legalEscalation: legalData.data } : prev
      );
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGeneratingLetter(false);
    }
  };

  const generateGuide = async () => {
    setGeneratingGuide(true);
    try {
      const res = await fetch("/api/legal/generate-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: params.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || "Failed to generate guide");
      const legalRes = await fetch(`/api/legal/${params.id}`);
      const legalData = await legalRes.json();
      setData((prev) =>
        prev ? { ...prev, legalEscalation: legalData.data } : prev
      );
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGeneratingGuide(false);
    }
  };

  const markLetterSent = async () => {
    setMarkingSent(true);
    try {
      await fetch(`/api/legal/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-sent" }),
      });
      const legalRes = await fetch(`/api/legal/${params.id}`);
      const legalData = await legalRes.json();
      setData((prev) =>
        prev ? { ...prev, legalEscalation: legalData.data } : prev
      );
    } finally {
      setMarkingSent(false);
    }
  };

  const resolveEscalation = async () => {
    setResolving(true);
    try {
      await fetch(`/api/legal/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve" }),
      });
      const legalRes = await fetch(`/api/legal/${params.id}`);
      const legalData = await legalRes.json();
      setData((prev) =>
        prev ? { ...prev, legalEscalation: legalData.data } : prev
      );
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Invoice not found</p>
      </div>
    );
  }

  const { invoice, legalEscalation } = data;
  const status = legalEscalation?.status || "not_started";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/app/invoices/${invoice.id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Legal Escalation</h1>
            <Badge
              variant={
                status === "resolved"
                  ? "secondary"
                  : status === "letter_sent" || status === "small_claims_guide_generated"
                    ? "default"
                    : "outline"
              }
            >
              {status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {invoice.invoiceNumber} — {invoice.clientName}
          </p>
        </div>
      </div>

      {/* Overdue alert */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-lg">Invoice Overdue</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-xl font-bold">{formatCurrency(invoice.total)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Days Overdue</p>
              <p className="text-xl font-bold text-red-500">
                {invoice.daysOverdue} days
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="text-xl font-bold">{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Invoice Status</p>
              <Badge
                variant={
                  invoice.status === "overdue" ? "destructive" : "secondary"
                }
                className="mt-1"
              >
                {invoice.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Process Flow */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formal Letter */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Formal Demand Letter</CardTitle>
            </div>
            <CardDescription>
              Generate a formal demand letter for legal escalation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!legalEscalation?.formalLetterContent ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <div>
                  <p className="font-medium">No letter generated yet</p>
                  <p className="text-sm text-muted-foreground">
                    Generate a formal demand letter to send to the client
                  </p>
                </div>
                <Button
                  onClick={generateLetter}
                  disabled={generatingLetter}
                >
                  {generatingLetter ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Generate Demand Letter
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Letter generated
                  {legalEscalation.formalLetterSentAt && (
                    <span className="text-muted-foreground">
                      · Sent {formatDate(legalEscalation.formalLetterSentAt)}
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">
                  {legalEscalation.formalLetterContent}
                </div>
              </div>
            )}
          </CardContent>
          {legalEscalation?.formalLetterContent && !legalEscalation.formalLetterSentAt && (
            <CardFooter>
              <Button
                variant="secondary"
                onClick={markLetterSent}
                disabled={markingSent}
                className="w-full"
              >
                {markingSent ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Mark as Sent
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Small Claims Guide */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Small Claims Guide</CardTitle>
            </div>
            <CardDescription>
              Generate a jurisdiction-specific small claims court guide
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!legalEscalation?.smallClaimsGuideContent ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                <div>
                  <p className="font-medium">No guide generated yet</p>
                  <p className="text-sm text-muted-foreground">
                    Generate a step-by-step guide for small claims court
                  </p>
                </div>
                <Button
                  onClick={generateGuide}
                  disabled={generatingGuide}
                >
                  {generatingGuide ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <BookOpen className="mr-2 h-4 w-4" />
                  )}
                  Generate Small Claims Guide
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Guide generated
                </div>
                <div className="max-h-80 overflow-y-auto rounded-lg border bg-muted p-4">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: legalEscalation.smallClaimsGuideContent,
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {status !== "resolved" && status !== "canceled" && (
              <>
                <Button
                  variant="outline"
                  onClick={generateLetter}
                  disabled={generatingLetter}
                >
                  {generatingLetter ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Regenerate Letter
                </Button>
                <Button
                  variant="outline"
                  onClick={generateGuide}
                  disabled={generatingGuide}
                >
                  {generatingGuide ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <BookOpen className="mr-2 h-4 w-4" />
                  )}
                  Regenerate Guide
                </Button>
              </>
            )}
            {status !== "resolved" && status !== "canceled" && (
              <Button
                variant="secondary"
                onClick={resolveEscalation}
                disabled={resolving}
              >
                {resolving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Mark as Resolved
              </Button>
            )}
            {status === "not_started" && (
              <Button
                variant="ghost"
                onClick={() => router.push(`/app/invoices/${invoice.id}`)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Escalation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
