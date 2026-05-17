"use client";

import { ClientData, CLIENT_PAYMENT_STATUS_LABELS, CLIENT_PAYMENT_STATUS_COLORS } from "@/types/client";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Eye, Mail, Plus, FileText } from "lucide-react";
import Link from "next/link";

interface ClientTableProps {
  clients: ClientData[];
}

export function ClientTable({ clients }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No clients found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Email</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Invoiced</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Paid</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Balance</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Last Invoice</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-b hover:bg-muted/50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {getInitials(client.name)}
                    </span>
                  </div>
                  <div>
                    <Link
                      href={`/app/clients/${client.id}`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {client.name}
                    </Link>
                    {client.company && (
                      <p className="text-xs text-muted-foreground">{client.company}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
                {client.email}
              </td>
              <td className="py-3 px-4 text-sm text-right hidden lg:table-cell">
                {formatCurrency(client.totalInvoiced)}
              </td>
              <td className="py-3 px-4 text-sm text-right hidden lg:table-cell">
                {formatCurrency(client.totalPaid)}
              </td>
              <td className="py-3 px-4 text-sm text-right font-medium hidden md:table-cell">
                {formatCurrency(client.totalInvoiced - client.totalPaid)}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    CLIENT_PAYMENT_STATUS_COLORS[client.paymentStatus]
                  }`}
                >
                  {CLIENT_PAYMENT_STATUS_LABELS[client.paymentStatus]}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-muted-foreground hidden lg:table-cell">
                {client.lastInvoiceDate ? formatDate(client.lastInvoiceDate) : "-"}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/app/clients/${client.id}`}
                    className="p-2 rounded-md hover:bg-muted transition-colors"
                    title="View client"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <a
                    href={`mailto:${client.email}`}
                    className="p-2 rounded-md hover:bg-muted transition-colors"
                    title="Send email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                  <Link
                    href={`/app/invoices/new?clientId=${client.id}`}
                    className="p-2 rounded-md hover:bg-muted transition-colors"
                    title="New invoice"
                  >
                    <FileText className="w-4 h-4" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
