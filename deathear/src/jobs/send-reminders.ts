import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { auth } from "@/lib/auth";

export const sendReminderJob = inngest.createFunction(
  { id: "send-reminders", name: "Send Invoice Reminders" },
  { cron: "0 8 * * *" }, // Daily at 8 AM
  async ({ step }) => {
    const sessions = await step.run("fetch-active-users", async () => {
      const users = await prisma.user.findMany({
        where: { subscription: { status: "ACTIVE" } },
        select: { id: true, email: true, name: true },
      });
      return users;
    });

    let totalSent = 0;
    let totalFailed = 0;

    for (const user of sessions) {
      await step.run(`process-reminders-for-${user.id}`, async () => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const invoicesDueForReminder = await prisma.invoice.findMany({
          where: {
            userId: user.id,
            reminderEnabled: true,
            reminderPaused: false,
            nextReminderDate: { lte: todayStart },
            status: { in: ["sent", "overdue"] },
          },
          include: {
            client: { select: { id: true, name: true, email: true, company: true } },
            reminders: { orderBy: { stepNumber: "desc" }, take: 1 },
          },
        });

        for (const invoice of invoicesDueForReminder) {
          try {
            const sequence: Array<{
              daysAfterDueDate: number;
              tone: "friendly" | "professional" | "urgent";
              subject: string;
              message: string;
            }> = JSON.parse(invoice.reminderSequence || "[]");

            const nextStep = invoice.currentReminderStep;
            const stepConfig = sequence[nextStep];

            if (!stepConfig) {
              // Sequence complete — move to collections
              await prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                  reminderEnabled: false,
                  status: "overdue",
                },
              });
              continue;
            }

            const subject = stepConfig.subject.replace(
              /{{(invoiceNumber|clientName|dueDate|amount|daysOverdue)}}/g,
              (match) => {
                const key = match.slice(2, -1);
                const daysOverdue = Math.floor(
                  (now.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                );
                const values: Record<string, string> = {
                  invoiceNumber: invoice.invoiceNumber,
                  clientName: invoice.client?.name || "Client",
                  dueDate: new Date(invoice.dueDate).toLocaleDateString(),                    amount: `$${((invoice as any).total / 100).toFixed(2)}`,
                  daysOverdue: String(Math.max(0, daysOverdue)),
                };
                return values[key] || match;
              }
            );

            const messageHtml = stepConfig.message
              .replace(/\n/g, "<br>")
              .replace(
                /{{(invoiceNumber|clientName|dueDate|amount|daysOverdue)}}/g,
                (match) => {
                  const key = match.slice(2, -1);
                  const daysOverdue = Math.floor(
                    (now.getTime() - new Date(invoice.dueDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const values: Record<string, string> = {
                    invoiceNumber: invoice.invoiceNumber,
                    clientName: invoice.client?.name || "Client",
                    dueDate: new Date(invoice.dueDate).toLocaleDateString(),
                    amount: `$${((invoice as any).total / 100).toFixed(2)}`,
                    daysOverdue: String(Math.max(0, daysOverdue)),
                  };
                  return values[key] || match;
                }
              );

            const emailResult = await sendReminderEmail({
              to: invoice.client?.email || "",
              subject: subject,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>${subject}</h2>
                  <div style="background: #f9fafb; padding: 24px; border-radius: 8px; margin: 16px 0;">
                    ${messageHtml}
                  </div>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                  <p style="color: #6b7280; font-size: 12px;">
                    Sent via DeathFear — Automated Invoice Reminder
                  </p>
                </div>
              `,
            });

            const nextReminderDate = new Date(todayStart);
            nextReminderDate.setDate(
              nextReminderDate.getDate() + (stepConfig.daysAfterDueDate || 7)
            );

            await prisma.reminder.create({
              data: {
                invoiceId: invoice.id,
                stepNumber: nextStep + 1,
                tone: stepConfig.tone,
                daysAfterDueDate: stepConfig.daysAfterDueDate,
                subject,
                message: stepConfig.message,
                wasAIGenerated: false,
                deliveryStatus: (emailResult as any)?.id ? "sent" : "failed",
                sentAt: now,
              },
            });

            await prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                currentReminderStep: nextStep + 1,
                nextReminderDate,
                status: "sent",
              },
            });

            totalSent++;
          } catch (error) {
            totalFailed++;
            console.error(
              `Failed to send reminder for invoice ${invoice.id}:`,
              error
            );

            await prisma.reminder.create({
              data: {
                invoiceId: invoice.id,
                stepNumber: invoice.currentReminderStep + 1,
                tone: "professional",
                daysAfterDueDate: 7,
                subject: `Reminder: Invoice ${invoice.invoiceNumber}`,
                message: "Failed to send automated reminder.",
                deliveryStatus: "failed",
                errorMessage: error instanceof Error ? error.message : "Unknown error",
                sentAt: now,
              },
            });
          }
        }
      });
    }

    return { totalSent, totalFailed };
  }
);
