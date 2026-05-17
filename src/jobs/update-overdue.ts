import { prisma } from "@/lib/db";
import { inngest } from "@/lib/inngest";

export const updateOverdueJob = inngest.createFunction(
  { id: "update-overdue", retries: 3 },
  { cron: "TZ=America/New_York 0 2 * * *" },
  async ({ step }) => {
    const now = new Date();

    // --- Step 1: Mark overdue invoices ---
    const overdueInvoices = await step.run("mark-overdue-invoices", async () => {
      return prisma.invoice.findMany({
        where: {
          status: "sent",
          dueDate: { lt: now },
          paidDate: null,
        },
        select: {
          id: true,
          invoiceNumber: true,
          dueDate: true,
          amount: true,
          userId: true,
          clientId: true,
          reminderSequence: true,
          currentReminderStep: true,
          reminderEnabled: true,
          nextReminderDate: true,
        },
      });
    });

    const updated: string[] = [];
    for (const invoice of overdueInvoices) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "overdue",
          nextReminderDate: invoice.reminderEnabled && !invoice.nextReminderDate
            ? new Date(new Date(invoice.dueDate).getTime() + 7 * 24 * 60 * 60 * 1000)
            : undefined,
        },
      });
      updated.push(invoice.id);
    }

    // --- Step 2: Mark final notice (90+ days overdue) ---
    const finalNoticeInvoices = await step.run("mark-final-notice-invoices", async () => {
      return prisma.invoice.findMany({
        where: {
          status: "overdue",
          dueDate: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
          paidDate: null,
        },
        select: {
          id: true,
          invoiceNumber: true,
        },
      });
    });

    const finalNoticed: string[] = [];
    for (const invoice of finalNoticeInvoices) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          reminderEnabled: false,
          reminderPaused: true,
          nextReminderDate: null,
        },
      });
      finalNoticed.push(invoice.id);
    }

    // --- Step 3: Auto write-off (180+ days overdue) ---
    const writeOffInvoices = await step.run("auto-write-off", async () => {
      return prisma.invoice.findMany({
        where: {
          status: "overdue",
          dueDate: { lt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) },
          paidDate: null,
        },
        select: { id: true, amount: true },
      });
    });

    const writtenOff: string[] = [];
    for (const invoice of writeOffInvoices) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "written_off",
          notes: `Auto-write-off: Invoice ${invoice.id} written off after 180 days overdue. Amount: $${invoice.amount.toFixed(2)}. Date: ${now.toISOString()}.`,
        },
      });
      writtenOff.push(invoice.id);
    }

    return {
      updatedCount: updated.length,
      finalNoticedCount: finalNoticed.length,
      writtenOffCount: writtenOff.length,
    };
  }
);
