import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHmac } from "crypto";

function verifyResendSignature(body: string, signature: string, webhookSecret: string): boolean {
  try {
    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");
    return expectedSignature === signature;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("svix-signature-256") || req.headers.get("x-resend-signature");
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!signature) {
      return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
    }

    // Verify webhook signature if secret is configured
    if (webhookSecret && !verifyResendSignature(body, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.type;

    switch (eventType) {
      case "email.delivered": {
        const emailData = event.data;
        if (emailData?.email_id) {
          await prisma.reminder.updateMany({
            where: { deliveryStatus: "sent" },
            data: { deliveryStatus: "delivered" },
          });
          await prisma.notificationLog.updateMany({
            where: { resendId: emailData.email_id },
            data: { deliveryStatus: "delivered" },
          });
        }
        break;
      }

      case "email.opened": {
        const openedEmail = event.data;
        if (openedEmail?.email_id) {
          // Find the reminder by the notification log
          const log = await prisma.notificationLog.findFirst({
            where: { resendId: openedEmail.email_id },
          });
          if (log) {
            // Update the reminder's openedAt
            const reminder = await prisma.reminder.findFirst({
              where: {
                sentAt: { not: null },
                invoice: {
                  userId: log.userId || undefined,
                },
              },
              orderBy: { createdAt: "desc" },
            });
            if (reminder) {
              await prisma.reminder.update({
                where: { id: reminder.id },
                data: {
                  deliveryStatus: "opened",
                  openedAt: new Date(),
                },
              });
            }
          }
          await prisma.notificationLog.updateMany({
            where: { resendId: openedEmail.email_id },
            data: { deliveryStatus: "opened" },
          });
        }
        break;
      }

      case "email.bounced": {
        const bouncedEmail = event.data;
        if (bouncedEmail?.email_id) {
          const log = await prisma.notificationLog.findFirst({
            where: { resendId: bouncedEmail.email_id },
          });

          if (log) {
            await prisma.notificationLog.update({
              where: { id: log.id },
              data: {
                deliveryStatus: "bounced",
                errorMessage: bouncedEmail.bounce?.message || "Email bounced",
              },
            });

            // Pause reminders for the associated invoice
            const reminder = await prisma.reminder.findFirst({
              where: {
                sentAt: { not: null },
                invoice: {
                  userId: log.userId || undefined,
                },
              },
              include: { invoice: true },
              orderBy: { createdAt: "desc" },
            });

            if (reminder) {
              await prisma.reminder.update({
                where: { id: reminder.id },
                data: {
                  deliveryStatus: "bounced",
                  errorMessage: bouncedEmail.bounce?.message || "Email bounced",
                },
              });

              // Pause the invoice's reminders
              await prisma.invoice.update({
                where: { id: reminder.invoiceId },
                data: { reminderPaused: true },
              });
            }
          }
        }
        break;
      }

      case "email.complained": {
        const complainedEmail = event.data;
        if (complainedEmail?.email_id) {
          const log = await prisma.notificationLog.findFirst({
            where: { resendId: complainedEmail.email_id },
          });

          if (log) {
            await prisma.notificationLog.update({
              where: { id: log.id },
              data: { deliveryStatus: "bounced" },
            });
          }

          // Pause all reminders for spam complaints
          await prisma.reminder.updateMany({
            where: { deliveryStatus: "sent" },
            data: { deliveryStatus: "bounced" },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled Resend webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Resend webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
