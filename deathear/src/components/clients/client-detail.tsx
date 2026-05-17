"use client";

import { ClientData } from "@/types/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building2, FileText, Plus, DollarSign } from "lucide-react";
import Link from "next/link";

interface ClientDetailProps {
  client: ClientData & { invoices?: any[] };
}

const statusBadgeVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  none: "secondary",
  paid: "success",
  partial: "warning",
  overdue: "destructive",
  collections: "destructive",
};

const statusLabels: Record<string, string> = {
  none: "No Invoices",
  paid: "Good Standing",
  partial: "Partial Payments",
  overdue: "Overdue",
  collections: "Collections",
};

export function ClientDetailView({ client }: ClientDetailProps) {
  const balance = client.totalInvoiced - client.totalPaid;

  return (
    <div className="space-y-6">
      {/* Client Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <CardTitle className="text-xl">{client.name}</CardTitle>
                {client.company && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {client.company}
                  </div>
                )}
              </div>
            </div>
          </div>
          <Badge variant={statusBadgeVariant[client.paymentStatus] || "secondary"}>
            {statusLabels[client.paymentStatus] || client.paymentStatus}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <a href={`mailto:${client.email}`} className="hover:text-primary transition-colors">
              {client.email}
            </a>
          </div>
          {client.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
          )}
          {client.notes && (
            <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">{client.notes}</p>
          )}
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(client.totalInvoiced)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{formatCurrency(client.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balance > 0 ? "text-destructive" : "text-success"}`}>
              {formatCurrency(balance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{client.invoiceCount || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link
            href={`/app/invoices/new?clientId=${client.id}`}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
          <Link
            href={`/app/clients/${client.id}`}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            Record Payment
          </Link>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          {client.invoices && client.invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Title</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Due Date</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {client.invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 text-sm font-medium">{inv.invoiceNumber}</td>
                      <td className="py-2 px-3 text-sm text-muted-foreground">{inv.title}</td>
                      <td className="py-2 px-3 text-sm text-right">{formatCurrency(inv.amount)}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          inv.status === "paid" ? "bg-green-100 text-green-700" :
                          inv.status === "overdue" ? "bg-red-100 text-red-700" :
                          inv.status === "draft" ? "bg-gray-100 text-gray-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-sm text-muted-foreground hidden md:table-cell">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Link
                          href={`/app/invoices/${inv.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No invoices yet for this client.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
