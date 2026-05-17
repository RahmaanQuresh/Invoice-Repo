export interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  title: string;
  amount: number;
  total: number;
  subtotal: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  issueDate: string;
  sentDate?: string | null;
  paidDate?: string | null;
  viewedDate?: string | null;
  paidAmount: number;
  amountPaid?: number;
  notes?: string | null;
  internalNotes?: string | null;
  terms?: string | null;
  lineItems: LineItem[];
  paymentTerms?: string;
  taxAmount?: number;
  discountAmount?: number;
  reminderSequence?: ReminderStep[];
  currentReminderStep: number;
  nextReminderDate?: string | null;
  reminderEnabled: boolean;
  reminderPaused: boolean;
  reminderFirstAfterDays?: number;
  reminderFrequencyDays?: number;
  taxRate: number;
  discountPercent: number;
  clientName?: string;
  client?: {
    id: string;
    name: string;
    email: string;
    company?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "overdue"
  | "paid"
  | "partially_paid"
  | "canceled";

export interface ReminderStep {
  daysAfterDueDate: number;
  tone: ReminderTone;
  subject: string;
  message: string;
  sentAt?: string | null;
  step?: number;
  status?: "pending" | "sent" | "delivered" | "bounced" | "opened";
}

export type ReminderTone = "friendly" | "professional" | "urgent";

export interface InvoiceFilters {
  status?: InvoiceStatus;
  search?: string;
  sort: string;
  order?: "asc" | "desc";
  page: number;
  perPage: number;
}

export interface InvoiceFormData {
  clientId: string;
  title: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  paymentTerms: PaymentTerms;
  lineItems: LineItem[];
  taxRate: number;
  discountPercent: number;
  notes: string;
  internalNotes: string;
  reminderEnabled: boolean;
  reminderFirstAfterDays: number;
  reminderFrequencyDays: number;
}

export type PaymentTerms = "net15" | "net30" | "net60" | "due_on_receipt" | "custom";
