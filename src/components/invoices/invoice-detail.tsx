"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { ReminderSequence } from "@/components/reminders/reminder-sequence";
import { InvoiceData } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  CreditCard,
  Download,
  Edit,
  Clock,
  CheckCircle2,
  Eye,
  Bell,
  Loader2,
  User,
  Calendar,
  Hash,
  Percent,
  FileText,
  AlertTriangle,
  Scale,
} from "lucide-react";
import { toast } from "sonner";

interface InvoiceDetailViewProps {
  invoice: InvoiceData;
}

export function InvoiceDetailView({ invoice }: InvoiceDetailViewProps) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidAmount, setPaidAmount] = useState(String(invoice.total));
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [updatingReminder, setUpdatingReminder] = useState(false);

  const timelineEvents = [
    {
      date: invoice.createdAt,
      icon: FileText,
      title: "Invoice Created",
      description: `Invoice ${invoice.invoiceNumber} was created`,
      color: "text-blue-500",
      bg: "bg-blue-100",
    },
    ...(invoice.sentDate
      ? [
          {
            date: invoice.sentDate,
            icon: Send,
            title: "Invoice Sent",
            description: `Sent to ${invoice.clientName || "client"}`,
            color: "text-indigo-500",
            bg: "bg-indigo-100",
          },
        ]
      : []),
    ...(invoice.viewedDate
      ? [
          {
            date: invoice.viewedDate,
            icon: Eye,
            title: "Invoice Viewed",
            description: "Client viewed the invoice",
            color: "text-amber-500",
            bg: "bg-amber-100",
          },
        ]
      : []),
    ...(invoice.paidDate
      ? [
          {
            date: invoice.paidDate,
            icon: CheckCircle2,
            title: "Payment Received",
            description: `Payment of ${formatCurrency(invoice.paidAmount || invoice.total)} received`,
            color: "text-green-500",
            bg: "bg-green-100",
          },
        ]
      : []),
  ].filter((e): e is typeof e & { date: string } => !!e.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSend = async () => {
    setIsSending(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || "Failed to send");
      toast.success("Invoice sent successfully");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invoice");
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkPaid = async () => {
    setIsMarkingPaid(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidDate,
          amount: parseFloat(paidAmount),
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || "Failed to mark as paid");
      toast.success("Invoice marked as paid");
      setShowPaymentForm(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark as paid");
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleUpdateReminder = async (updates: {
    reminderEnabled?: boolean;
    reminderPaused?: boolean;
    reminderSequence?: import("@/types/invoice").ReminderStep[];
  }) => {
    setUpdatingReminder(true);
    try {
      const res = await fetch(`/api/reminders/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update reminder");
      toast.success("Reminder settings updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update reminder");
    } finally {
      setUpdatingReminder(false);
    }
  };

  const daysOverdue = invoice.status === "overdue" || invoice.status === "sent"
    ? Math.max(0, Math.floor(
        (new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      ))
    : 0;

  const isOverdue =
    invoice.status === "overdue" ||
    (invoice.status === "sent" && new Date(invoice.dueDate) < new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {invoice.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-muted-foreground">{invoice.title}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status === "draft" && (
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Invoice
            </Button>
          )}
          {(invoice.status === "sent" || invoice.status === "overdue" || invoice.status === "viewed" || invoice.status === "partially_paid") && (
            <Button onClick={() => setShowPaymentForm(!showPaymentForm)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          {invoice.status === "draft" && (
            <Button variant="outline" asChild>
              <Link href={`/app/invoices/${invoice.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {(invoice.status === "overdue" || isOverdue) && (
            <Button variant="outline" asChild>
              <Link href={`/app/invoices/${invoice.id}/legal`}>
                <Scale className="mr-2 h-4 w-4" />
                Legal
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={() => toast.info("PDF download coming soon")}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Payment Form */}
      {showPaymentForm && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Date</label>
                <Input
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Method</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleMarkPaid}
                  disabled={isMarkingPaid}
                  className="w-full"
                >
                  {isMarkingPaid && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Payment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Alert */}
      {isOverdue && invoice.status !== "paid" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                This invoice is overdue
              </p>
              <p className="text-sm text-red-600">
                Due date was {formatDate(invoice.dueDate)}. 
                {daysOverdue >= 30 ? " Consider initiating collections or legal escalation." : " Send a reminder to the client."}
              </p>
            </div>
            {daysOverdue >= 30 && (
              <Button variant="destructive" size="sm" asChild>
                <Link href={`/app/invoices/${invoice.id}/legal`}>
                  <Scale className="mr-2 h-4 w-4" />
                  Escalate
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Invoice Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Invoice Preview Card */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-muted-foreground">{invoice.title}</p>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Bill To */}
              <div className="mb-6">
                <p className="mb-1 text-sm font-medium text-muted-foreground">Bill To</p>
                <p className="font-medium">{invoice.clientName || "Unknown Client"}</p>
              </div>

              {/* Line Items */}
              <table className="w-full mb-6">
                <thead>
                  <tr className="border-y bg-muted/30">
                    <th className="py-2 text-left text-sm font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="py-2 text-right text-sm font-medium text-muted-foreground">
                      Qty
                    </th>
                    <th className="py-2 text-right text-sm font-medium text-muted-foreground">
                      Rate
                    </th>
                    <th className="py-2 text-right text-sm font-medium text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.lineItems?.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 text-sm">{item.description}</td>
                      <td className="py-3 text-right text-sm">{item.quantity}</td>
                      <td className="py-3 text-right text-sm">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="py-3 text-right text-sm font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="ml-auto w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {(invoice.discountPercent ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount ({invoice.discountPercent}%)
                    </span>
                    <span className="text-destructive">
                      -{formatCurrency(invoice.discountAmount || 0)}
                    </span>
                  </div>
                )}
                {(invoice.taxRate ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tax ({invoice.taxRate}%)
                    </span>
                    <span>{formatCurrency(invoice.taxAmount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="mt-6 rounded-lg bg-muted/30 p-4">
                  <p className="mb-1 text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Client</p>
                  <p className="font-medium">{invoice.clientName || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Issue Date</p>
                  <p className="font-medium">{formatDate(invoice.issueDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Payment Terms</p>
                  <p className="font-medium capitalize">
                    {invoice.paymentTerms?.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              {(invoice.taxRate ?? 0) > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Tax Rate</p>
                    <p className="font-medium">{invoice.taxRate}%</p>
                  </div>
                </div>
              )}
              {(invoice.discountPercent ?? 0) > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Discount</p>
                    <p className="font-medium">{invoice.discountPercent}%</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineEvents.map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`rounded-full p-1.5 ${event.bg}`}>
                        <event.icon className={`h-3.5 w-3.5 ${event.color}`} />
                      </div>
                      {i < timelineEvents.length - 1 && (
                        <div className="mt-1 w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.date)}
                      </p>
                    </div>
                  </div>
                ))}
                {timelineEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No events yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reminder Sequence */}
          <ReminderSequence
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoiceNumber}
            clientName={invoice.clientName || "Unknown"}
            clientEmail={invoice.client?.email || ""}
            daysOverdue={daysOverdue}
            amount={invoice.total}
            reminderEnabled={invoice.reminderEnabled ?? false}
            reminderPaused={invoice.reminderPaused ?? false}
            currentStep={invoice.currentReminderStep ?? 0}
            sequence={invoice.reminderSequence || []}
            nextReminderDate={invoice.nextReminderDate}
            onUpdate={handleUpdateReminder}
          />

          {/* Legal Escalation */}
          {(isOverdue || daysOverdue > 0) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Legal Escalation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {daysOverdue >= 90 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Final notice recommended</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This invoice is {daysOverdue} days overdue. Consider sending a final notice
                      letter and escalating to small claims court.
                    </p>
                    <Button className="w-full" variant="destructive" asChild>
                      <Link href={`/app/invoices/${invoice.id}/legal`}>
                        <Scale className="mr-2 h-4 w-4" />
                        Start Legal Process
                      </Link>
                    </Button>
                  </div>
                ) : daysOverdue >= 30 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Collections recommended</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This invoice is {daysOverdue} days overdue. Consider escalating to collections
                      or generating a formal demand letter.
                    </p>
                    <Button variant="secondary" className="w-full" asChild>
                      <Link href={`/app/invoices/${invoice.id}/legal`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Demand Letter
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      This invoice is {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue.
                      Automated reminders are the first step. Legal escalation will be available
                      after 30 days.
                    </p>
                    <Button variant="outline" className="w-full" disabled>
                      <Scale className="mr-2 h-4 w-4" />
                      Available after 30 days overdue
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
