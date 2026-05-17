import { ReminderTone } from "./invoice";

export type ReminderDeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "bounced"
  | "failed"
  | "opened";

export interface ReminderData {
  id: string;
  invoiceId: string;
  stepNumber: number;
  tone: ReminderTone;
  daysAfterDueDate: number;
  subject: string;
  message: string;
  wasAIGenerated: boolean;
  wasEditedByUser: boolean;
  sentAt: string | null;
  openedAt: string | null;
  deliveryStatus: ReminderDeliveryStatus;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
}

export interface ReminderFilters {
  invoiceId?: string;
  deliveryStatus?: ReminderDeliveryStatus;
}

export type LegalEscalationStatus =
  | "not_started"
  | "letter_generated"
  | "letter_sent"
  | "small_claims_guide_generated"
  | "paused"
  | "canceled"
  | "resolved";

export interface LegalEscalationData {
  id: string;
  invoiceId: string;
  userId: string;
  formalLetterGenerated: boolean;
  formalLetterContent: string | null;
  formalLetterSentAt: string | null;
  smallClaimsGuideGenerated: boolean;
  smallClaimsGuideContent: string | null;
  smallClaimsGuideState: string | null;
  status: LegalEscalationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateLetterResponse {
  letter: string;
  escalation: LegalEscalationData;
}

export interface GenerateGuideResponse {
  guide: GuideSection[];
}

export interface GuideSection {
  title: string;
  content: string;
}

export interface CollectionsSummary {
  totalInCollections: number;
  totalOutstanding: number;
  invoiceCount: number;
  oldestInvoiceDate: string | null;
  averageDaysOverdue: number;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    clientName: string;
    clientEmail: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
    currentReminderStep: number;
    nextReminderDate: string | null;
    legalStatus: LegalEscalationStatus;
  }>;
}

export const REMINDER_DELIVERY_STATUS_LABELS: Record<ReminderDeliveryStatus, string> = {
  pending: "Pending",
  sent: "Sent",
  delivered: "Delivered",
  bounced: "Bounced",
  failed: "Failed",
  opened: "Opened",
};

export const REMINDER_DELIVERY_STATUS_COLORS: Record<ReminderDeliveryStatus, string> = {
  pending: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  bounced: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
  opened: "bg-purple-100 text-purple-800",
};

export const LEGAL_ESCALATION_STATUS_LABELS: Record<LegalEscalationStatus, string> = {
  not_started: "Not Started",
  letter_generated: "Letter Generated",
  letter_sent: "Letter Sent",
  small_claims_guide_generated: "Guide Generated",
  paused: "Paused",
  canceled: "Canceled",
  resolved: "Resolved",
};
