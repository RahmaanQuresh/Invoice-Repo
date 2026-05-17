import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  rate: z.number().positive("Rate must be positive"),
  amount: z.number().positive("Amount must be positive"),
});

export const invoiceSchema = z
  .object({
    clientId: z.string().uuid("Client is required"),
    title: z.string().min(1, "Title is required").max(255),
    invoiceNumber: z.string().min(1, "Invoice number is required").max(50),
    issueDate: z.string().min(1, "Issue date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    paymentTerms: z.enum(["net15", "net30", "net60", "due_on_receipt", "custom"]),
    lineItems: z
      .array(lineItemSchema)
      .min(1, "At least one line item is required"),
    taxRate: z.number().min(0).max(100).optional().default(0),
    discountPercent: z.number().min(0).max(100).optional().default(0),
    notes: z.string().optional().default(""),
    internalNotes: z.string().optional().default(""),
    reminderEnabled: z.boolean().optional().default(true),
    reminderFirstAfterDays: z.number().min(1).optional().default(7),
    reminderFrequencyDays: z.number().min(1).optional().default(7),
  })
  .refine(
    (data) => {
      const due = new Date(data.dueDate);
      const issue = new Date(data.issueDate);
      return due >= issue;
    },
    {
      message: "Due date must be on or after issue date",
      path: ["dueDate"],
    }
  );

export type InvoiceSchemaType = z.infer<typeof invoiceSchema>;

export const markAsPaidSchema = z.object({
  paidDate: z.string().min(1, "Date is required"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.string().optional().default("other"),
  notes: z.string().optional().default(""),
});

export type MarkAsPaidSchemaType = z.infer<typeof markAsPaidSchema>;
