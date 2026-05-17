"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { ClientData } from "@/types/client";
import { InvoiceData } from "@/types/invoice";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EditInvoicePage() {
  const params = useParams();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, invoiceRes] = await Promise.all([
          fetch("/api/clients?perPage=100"),
          fetch(`/api/invoices/${params.id}`),
        ]);

        const clientsData = await clientsRes.json();
        const invoiceData = await invoiceRes.json();

        if (!clientsRes.ok) throw new Error(clientsData.error?.message || "Failed to load");
        if (!invoiceRes.ok) throw new Error(invoiceData.error?.message || "Failed to load");

        setClients(clientsData.data || []);
        setInvoice(invoiceData.data);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold">Invoice not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The invoice you&apos;re looking for doesn&apos;t exist
        </p>
      </div>
    );
  }

  if (invoice.status !== "draft") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/app/invoices/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cannot Edit</h1>
            <p className="text-sm text-muted-foreground">
              Only draft invoices can be edited
            </p>
          </div>
        </div>
      </div>
    );
  }

  const defaultValues = {
    clientId: invoice.clientId,
    title: invoice.title,
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    paymentTerms: invoice.paymentTerms as "net15" | "net30" | "net60" | "due_on_receipt" | "custom",
    lineItems: invoice.lineItems?.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
    })) || [{ description: "", quantity: 1, rate: 0, amount: 0 }],
    taxRate: invoice.taxRate ?? 0,
    discountPercent: invoice.discountPercent ?? 0,
    notes: invoice.notes || "",
    internalNotes: invoice.internalNotes || "",
    reminderEnabled: invoice.reminderEnabled ?? true,
    reminderFirstAfterDays: invoice.reminderFirstAfterDays ?? 7,
    reminderFrequencyDays: invoice.reminderFrequencyDays ?? 7,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/app/invoices/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Edit {invoice.invoiceNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            Update invoice details
          </p>
        </div>
      </div>

      <InvoiceForm
        clients={clients}
        defaultValues={defaultValues}
        isEditing
        invoiceId={params.id as string}
      />
    </div>
  );
}
