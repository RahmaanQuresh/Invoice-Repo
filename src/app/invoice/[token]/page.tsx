"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExternalLink, AlertCircle } from "lucide-react";

interface SharedInvoice {
  invoiceNumber: string;
  title: string;
  amount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
  issueDate: string;
  currency: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  notes: string;
  terms: string;
  client: {
    name: string;
    company: string;
    email: string;
  };
  freelancer: {
    name: string;
    email: string;
    paymentLink: string;
  };
}

export default function InvoicePortalPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<SharedInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoice() {
      try {
        const res = await fetch(`/api/share/${params.token}`);
        const data = await res.json();

        if (data.success) {
          setInvoice(data.data);
        } else {
          setError(data.error?.message || "Invoice not found");
        }
      } catch {
        setError("Failed to load invoice. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (params.token) {
      loadInvoice();
    }
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="mx-auto max-w-3xl">
          <DetailSkeleton />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md text-center">
          <CardContent className="pt-8">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h1 className="mb-2 text-xl font-semibold">Invoice Not Available</h1>
            <p className="text-muted-foreground">
              {error || "This invoice could not be found. The link may be invalid or expired."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = invoice.status === "paid";
  const balance = invoice.amount - invoice.paidAmount;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-sm text-muted-foreground">
            Invoice from <span className="font-semibold text-foreground">{invoice.freelancer.name}</span>
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <Badge
              variant={
                isPaid ? "default" :
                invoice.status === "overdue" ? "destructive" :
                invoice.status === "viewed" ? "secondary" :
                "outline"
              }
              className="text-sm"
            >
              {invoice.status === "paid" ? "Paid" :
               invoice.status === "overdue" ? "Overdue" :
               invoice.status === "viewed" ? "Viewed" :
               invoice.status === "draft" ? "Draft" : "Sent"}
            </Badge>
          </div>
        </div>

        {/* Invoice Card */}
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{invoice.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Invoice #{invoice.invoiceNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {formatCurrency(isPaid ? invoice.amount : balance, invoice.currency)}
                </p>
                {isPaid ? (
                  <p className="text-sm text-green-600">Paid in full</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Due {formatDate(invoice.dueDate)}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Bill To */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Bill To</h3>
              <p className="font-medium">{invoice.client.name}</p>
              {invoice.client.company && (
                <p className="text-sm text-muted-foreground">{invoice.client.company}</p>
              )}
              <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Invoice Date:</span>
                <span className="ml-2">{formatDate(invoice.issueDate)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Due Date:</span>
                <span className="ml-2">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Description</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Qty</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Rate</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">{formatCurrency(item.rate, invoice.currency)}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(item.amount, invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="pt-3 text-right font-medium">Total:</td>
                    <td className="pt-3 text-right font-bold">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {invoice.notes && (
              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-1 text-sm font-medium">Notes</h3>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pay Now Button */}
        {!isPaid && invoice.freelancer.paymentLink && (
          <div className="mt-6 text-center">
            <Button
              size="lg"
              className="gap-2"
              onClick={() => window.open(invoice.freelancer.paymentLink, "_blank")}
            >
              Pay Now
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Sent via DeathFear on behalf of {invoice.freelancer.name}</p>
          <p className="mt-1">
            Questions? Reply to this email — replies go directly to {invoice.freelancer.name}.
          </p>
        </div>
      </div>
    </div>
  );
}
