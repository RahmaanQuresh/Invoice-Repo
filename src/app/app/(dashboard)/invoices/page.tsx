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
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { Pagination } from "@/components/shared/pagination";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { InvoiceData, InvoiceFilters, InvoiceStatus } from "@/types/invoice";
import { Plus, Search, FileText, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "canceled", label: "Canceled" },
];

function InvoicesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const filters: InvoiceFilters = {
    search: searchParams.get("search") || "",
    status: (searchParams.get("status") as InvoiceStatus) || undefined,
    sort: searchParams.get("sort") || "createdAt",
    order: (searchParams.get("order") as "asc" | "desc") || "desc",
    page: parseInt(searchParams.get("page") || "1"),
    perPage: 10,
  };

  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      params.set("sort", filters.sort);
      params.set("order", filters.order || "desc");
      params.set("page", String(filters.page));
      params.set("perPage", String(filters.perPage));

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to fetch");

      setInvoices(data.data);
      setTotal(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.status, filters.sort, filters.order, filters.page, filters.perPage]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.delete("page");
    router.push(`/app/invoices?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("search", searchInput);
  };

  const clearFilters = () => {
    setSearchInput("");
    router.push("/app/invoices");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Invoice deleted");
      fetchInvoices();
    } catch {
      toast.error("Failed to delete invoice");
    }
  };

  const handleSend = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to send");
      toast.success("Invoice sent");
      fetchInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const invoice = invoices.find((inv) => inv.id === id);
      const res = await fetch(`/api/invoices/${id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidDate: new Date().toISOString().split("T")[0],
          amount: invoice?.total || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to mark paid");
      toast.success("Invoice marked as paid");
      fetchInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark paid");
    }
  };

  const hasFilters = filters.search || filters.status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Create, send, and manage invoices
          </p>
        </div>
        <Button asChild>
          <Link href="/app/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
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
          value={filters.status || "all"}
          onValueChange={(v) => updateFilter("status", v)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.sort}
          onValueChange={(v) => updateFilter("sort", v)}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Date Created</SelectItem>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="total">Amount</SelectItem>
            <SelectItem value="invoiceNumber">Invoice #</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.order}
          onValueChange={(v) => updateFilter("order", v)}
        >
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest</SelectItem>
            <SelectItem value="asc">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-primary" />}
          title={hasFilters ? "No invoices match your search" : "No invoices yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters"
              : "Create your first invoice to get started"
          }
          actionLabel={hasFilters ? "Clear Filters" : "Create Invoice"}
          onAction={hasFilters ? clearFilters : undefined}
          actionHref={hasFilters ? undefined : "/app/invoices/new"}
        />
      ) : (
        <>
          <InvoiceTable
            invoices={invoices}
            onSend={handleSend}
            onMarkPaid={handleMarkPaid}
            onDelete={handleDelete}
          />
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

export default function InvoicesPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} cols={7} />}>
      <InvoicesPageContent />
    </Suspense>
  );
}
