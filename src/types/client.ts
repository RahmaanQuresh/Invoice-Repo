export type ClientPaymentStatus = "none" | "paid" | "partial" | "overdue" | "collections";

export interface ClientData {
  id: string;
  userId: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  notes?: string | null;
  totalInvoiced: number;
  totalPaid: number;
  balance?: number;
  paymentStatus: ClientPaymentStatus;
  lastInvoiceDate?: string | null;
  invoiceCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientFormData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  notes?: string;
}

export interface ClientFilters {
  search?: string;
  paymentStatus?: ClientPaymentStatus;
  sort: string;
  page: number;
  perPage: number;
}

export const CLIENT_PAYMENT_STATUS_LABELS: Record<ClientPaymentStatus, string> = {
  none: "No Invoices",
  paid: "Good Standing",
  partial: "Partial Payments",
  overdue: "Overdue",
  collections: "Collections",
};

export const CLIENT_PAYMENT_STATUS_COLORS: Record<ClientPaymentStatus, string> = {
  none: "bg-gray-100 text-gray-700",
  paid: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
  collections: "bg-red-100 text-red-700",
};
