"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientTable } from "@/components/clients/client-table";
import { Pagination } from "@/components/shared/pagination";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ClientData, ClientFilters, ClientPaymentStatus, CLIENT_PAYMENT_STATUS_LABELS } from "@/types/client";
import { Plus, Search, Users, X } from "lucide-react";
import { toast } from "sonner";

function ClientsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const filters: ClientFilters = {
    search: searchParams.get("search") || "",
    paymentStatus: (searchParams.get("paymentStatus") as ClientPaymentStatus) || undefined,
    sort: searchParams.get("sort") || "name",
    page: parseInt(searchParams.get("page") || "1"),
    perPage: 10,
  };

  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.paymentStatus)
        params.set("paymentStatus", filters.paymentStatus);
      params.set("sort", filters.sort);
      params.set("page", String(filters.page));
      params.set("perPage", String(filters.perPage));

      const res = await fetch(`/api/clients?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to fetch");

      setClients(data.data);
      setTotal(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.paymentStatus, filters.sort, filters.page, filters.perPage]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.delete("page");
    router.push(`/app/clients?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("search", searchInput);
  };

  const clearFilters = () => {
    setSearchInput("");
    router.push("/app/clients");
  };

  const hasFilters = filters.search || !!filters.paymentStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your clients and their invoices
          </p>
        </div>
        <Button asChild>
          <Link href="/app/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateFilter("search", "");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
        <Select
          value={filters.paymentStatus || "all"}
          onValueChange={(v) => updateFilter("paymentStatus", v)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(CLIENT_PAYMENT_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.sort}
          onValueChange={(v) => updateFilter("sort", v)}
        >
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="total">Total</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-primary" />}
          title={hasFilters ? "No clients match your search" : "No clients yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters"
              : "Add your first client to start creating invoices"
          }
          actionLabel={hasFilters ? "Clear Filters" : "Add Client"}
          onAction={hasFilters ? clearFilters : undefined}
          actionHref={hasFilters ? undefined : "/app/clients/new"}
        />
      ) : (
        <>
          <ClientTable clients={clients} />
          <Pagination
            page={filters.page}
            totalPages={totalPages}
            total={total}
            perPage={filters.perPage}
          />
        </>
      )}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={5} cols={6} />}>
      <ClientsPageContent />
    </Suspense>
  );
}
