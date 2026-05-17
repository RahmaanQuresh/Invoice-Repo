"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { InvoiceData, InvoiceStatus, InvoiceFilters } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FileText,
  Eye,
  Send,
  CreditCard,
  Trash2,
} from "lucide-react";

interface InvoiceTableProps {
  invoices: InvoiceData[];
  onSend?: (id: string) => void;
  onMarkPaid?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function InvoiceTable({
  invoices,
  onSend,
  onMarkPaid,
  onDelete,
}: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="mb-2 text-lg font-semibold">No invoices found</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Get started by creating your first invoice.
        </p>
        <Button asChild>
          <Link href="/app/invoices/new">Create Invoice</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Invoice
              </th>
              <th className="hidden px-4 py-3 text-left text-sm font-medium text-muted-foreground md:table-cell">
                Client
              </th>
              <th className="hidden px-4 py-3 text-left text-sm font-medium text-muted-foreground sm:table-cell">
                Status
              </th>
              <th className="hidden px-4 py-3 text-right text-sm font-medium text-muted-foreground lg:table-cell">
                Issue Date
              </th>
              <th className="hidden px-4 py-3 text-right text-sm font-medium text-muted-foreground lg:table-cell">
                Due Date
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="group transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/app/invoices/${invoice.id}`}
                    className="flex flex-col"
                  >
                    <span className="text-sm font-medium">
                      {invoice.invoiceNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {invoice.title}
                    </span>
                  </Link>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <Link
                    href={`/app/invoices/${invoice.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {invoice.clientName || "—"}
                  </Link>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <InvoiceStatusBadge status={invoice.status} />
                </td>
                <td className="hidden px-4 py-3 text-right text-sm text-muted-foreground lg:table-cell">
                  {formatDate(invoice.issueDate)}
                </td>
                <td className="hidden px-4 py-3 text-right text-sm text-muted-foreground lg:table-cell">
                  {formatDate(invoice.dueDate)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium">
                  {formatCurrency(invoice.total)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/app/invoices/${invoice.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {invoice.status === "draft" && onSend && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onSend(invoice.id)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {(invoice.status === "sent" || invoice.status === "overdue") && onMarkPaid && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onMarkPaid(invoice.id)}
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(invoice.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
