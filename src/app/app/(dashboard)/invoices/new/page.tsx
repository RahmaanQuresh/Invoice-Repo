"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { ClientData } from "@/types/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function NewInvoicePageContent() {
  const searchParams = useSearchParams();
  const preSelectedClientId = searchParams.get("clientId") || "";
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/clients?perPage=100");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to fetch");
        setClients(data.data || []);
      } catch {
        toast.error("Failed to load clients");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  if (loading) {
    return <DetailSkeleton />;
  }

  const defaultValues = preSelectedClientId
    ? { clientId: preSelectedClientId }
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Create a new invoice for a client
          </p>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-lg font-medium">No clients available</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You need to add a client before creating an invoice
          </p>
          <Button asChild className="mt-4">
            <Link href="/app/clients/new">Add Client</Link>
          </Button>
        </div>
      ) : (
        <InvoiceForm clients={clients} defaultValues={defaultValues} />
      )}
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <NewInvoicePageContent />
    </Suspense>
  );
}
