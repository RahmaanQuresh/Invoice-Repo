import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/db";

export const resumePausedReminders = inngest.createFunction(
  { id: "resume-paused-reminders", name: "Resume Paused Reminders" },
  { cron: "0 6 * * 1" }, // Weekly on Monday at 6 AM
  async ({ step }) => {
    const now = new Date();

    const result = await step.run("find-resumable-reminders", async () => {
      // Find invoices where reminders were paused but the pause has expired
      // Pause expires after 30 days by default
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const resumableInvoices = await prisma.invoice.findMany({
        where: {
          reminderPaused: true,
          nextReminderDate: { lt: thirtyDaysAgo },
          status: { in: ["sent", "overdue"] },
        },
        select: {
          id: true,
          invoiceNumber: true,
          currentReminderStep: true,
          reminderSequence: true,
          dueDate: true,
        },
      });

      let resumed = 0;
      let stuckSequence = 0;

      for (const invoice of resumableInvoices) {
        const sequence = JSON.parse(invoice.reminderSequence || "[]") as Array<{
          daysAfterDueDate: number;
        }>;

        // If the sequence is complete (past all steps), don't resume
        if (invoice.currentReminderStep >= sequence.length) {
          stuckSequence++;
          continue;
        }

        // Calculate next reminder date based on current step
        const nextStep = sequence[invoice.currentReminderStep];
        if (!nextStep) {
          stuckSequence++;
          continue;
        }

        const nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + nextStep.daysAfterDueDate);

        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            reminderPaused: false,
            reminderEnabled: true,
            nextReminderDate: nextDate,
          },
        });

        resumed++;
      }

      return { resumed, stuckSequence, total: resumableInvoices.length };
    });

    // Also reset reminders that have been stuck for too long
    await step.run("reset-stuck-reminders", async () => {
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Find invoices where reminders are stuck but the invoice is still overdue
      const stuckInvoices = await prisma.invoice.findMany({
        where: {
          reminderEnabled: false,
          reminderPaused: false,
          status: "overdue",
          nextReminderDate: null,
          updatedAt: { lt: sixtyDaysAgo },
        },
        select: { id: true, reminderSequence: true, dueDate: true },
      });

      let resetCount = 0;

      for (const invoice of stuckInvoices) {
        const sequence = JSON.parse(invoice.reminderSequence || "[]") as Array<{
          daysAfterDueDate: number;
        }>;

        if (sequence.length === 0) continue;

        const nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + sequence[0].daysAfterDueDate);

        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            currentReminderStep: 0,
            reminderEnabled: true,
            nextReminderDate: nextDate,
          },
        });

        resetCount++;
      }

      return { resetCount };
    });

    return {
      resumed: result.resumed,
      stuck: result.stuckSequence,
      totalProcessed: result.total,
    };
  }
);
