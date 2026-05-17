import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/db";

export const manageSubscriptionFeatures = inngest.createFunction(
  { id: "manage-subscription-features", name: "Manage Subscription Features" },
  { cron: "0 4 * * *" }, // Daily at 4 AM
  async ({ step }) => {
    const result = await step.run("suspend-features-for-expired", async () => {
      const now = new Date();

      const expiredSubscriptions = await prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          currentPeriodEnd: { lt: now },
        },
        select: {
          id: true,
          userId: true,
          plan: { select: { id: true, name: true, legalEscalationEnabled: true, aiToneEnabled: true } },
        },
      });

      const suspendedUsers: string[] = [];
      let affectedInvoices = 0;

      for (const sub of expiredSubscriptions) {
        // Pause all reminders for this user
        const updateResult = await prisma.invoice.updateMany({
          where: {
            userId: sub.userId,
            reminderEnabled: true,
          },
          data: {
            reminderEnabled: false,
            reminderPaused: true,
          },
        });
        affectedInvoices += updateResult.count;
        suspendedUsers.push(sub.userId);

        // Mark subscription as past_due
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "PAST_DUE" },
        });
      }

      return { suspendedUsersCount: suspendedUsers.length, affectedInvoices };
    });

    // Resume features for recently renewed subscriptions
    const resumeResult = await step.run("resume-features-for-renewed", async () => {
      const recentlyPastDue = new Date();
      recentlyPastDue.setDate(recentlyPastDue.getDate() - 7);

      const renewedSubscriptions = await prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          updatedAt: { gte: recentlyPastDue },
          currentPeriodEnd: { gte: new Date() },
        },
        select: { userId: true },
      });

      const resumedUsers: string[] = [];
      let resumedInvoices = 0;

      for (const sub of renewedSubscriptions) {
        const updateResult = await prisma.invoice.updateMany({
          where: {
            userId: sub.userId,
            reminderPaused: true,
          },
          data: {
            reminderPaused: false,
            reminderEnabled: true,
          },
        });
        resumedInvoices += updateResult.count;
        resumedUsers.push(sub.userId);
      }

      return { resumedUsersCount: resumedUsers.length, resumedInvoices };
    });

    return {
      suspended: { users: result.suspendedUsersCount, invoices: result.affectedInvoices },
      resumed: { users: resumeResult.resumedUsersCount, invoices: resumeResult.resumedInvoices },
    };
  }
);
