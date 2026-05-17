"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { ClientDetailView } from "@/components/clients/client-detail";
import { ClientData } from "@/types/client";
import { ArrowLeft, Edit, Plus } from "lucide-react";
import { toast } from "sonner";

export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/clients/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to fetch");
        setClient(data.data);
      } catch (err) {
        toast.error("Failed to load client");
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [params.id]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold">Client not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The client you&apos;re looking for doesn&apos;t exist
        </p>
        <Button asChild className="mt-4">
          <Link href="/app/clients">Back to Clients</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
            <p className="text-sm text-muted-foreground">
              {client.company || client.email}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/app/invoices/new?clientId=${client.id}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      <ClientDetailView client={client} />
    </div>
  );
}
