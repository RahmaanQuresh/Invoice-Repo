import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export async function generateNextInvoiceNumber(
  userId: string,
  year: number = new Date().getFullYear()
): Promise<string> {
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const counter = await tx.userInvoiceCounter.upsert({
      where: { userId },
      create: { userId, year, counter: 1 },
      update: { counter: { increment: 1 } },
    });
    return counter;
  });

  return generateInvoiceNumber(year, result.counter);
}

export function calculateInvoiceTotals(
  lineItems: Array<{ quantity: number; rate: number }>,
  taxRate: number = 0,
  discountPercent: number = 0
) {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );
  const discount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * (taxRate / 100);
  const total = afterDiscount + tax;

  return { subtotal, discount, tax, total };
}

export function getReminderToneForOverdueDays(daysOverdue: number): string {
  if (daysOverdue <= 7) return "casual";
  if (daysOverdue <= 14) return "formal";
  if (daysOverdue <= 21) return "informal";
  return "legal";
}

export const REMINDER_TEMPLATES = {
  casual: {
    subject: "Quick heads up about invoice {invoiceNumber}",
    message: `Hi {clientName},

Hope you're doing well! Just wanted to gently remind you that invoice {invoiceNumber} for {amount} was due on {dueDate}.

If it's already been paid, please ignore this message — and thank you! If not, no worries at all, just a friendly nudge.

Let me know if you have any questions.

Best,
{senderName}`,
  },
  formal: {
    subject: "Payment Reminder: Invoice {invoiceNumber}",
    message: `Dear {clientName},

This is a reminder that Invoice {invoiceNumber} in the amount of {amount} was due on {dueDate} and remains unpaid.

We kindly request that payment be made at your earliest convenience. If you have already sent payment, please disregard this notice.

Please refer to the attached invoice for payment details.

Sincerely,
{senderName}
{senderCompany}`,
  },
  informal: {
    subject: "Following up on invoice {invoiceNumber}",
    message: `Hey {clientName},

I'm just following up on invoice {invoiceNumber} ({amount}) which is now {daysOverdue} days past due.

I really need to get this sorted so I can close out the books. Can you please take care of this by the end of the week?

Thanks,
{senderName}`,
  },
  legal: {
    subject: "FINAL NOTICE: Invoice {invoiceNumber} — {daysOverdue} Days Overdue",
    message: `{clientName},

This is a formal notification that Invoice {invoiceNumber} in the amount of {amount} is now {daysOverdue} days past due.

If payment is not received within 7 days, we will have no choice but to pursue legal action, which may include:

1. Filing a formal demand letter
2. Reporting to credit bureaus
3. Pursuing the claim in small claims court

Please remit payment immediately to avoid escalation.

{senderName}`,
  },
} as const;
