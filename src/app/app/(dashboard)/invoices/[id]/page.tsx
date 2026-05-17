"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { InvoiceDetailView } from "@/components/invoices/invoice-detail";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { InvoiceData } from "@/types/invoice";
import { toast } from "sonner";

export default function InvoiceDetailPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to fetch");
        setInvoice(data.data);
      } catch (err) {
        toast.error("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
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

  return <InvoiceDetailView invoice={invoice} />;
}
