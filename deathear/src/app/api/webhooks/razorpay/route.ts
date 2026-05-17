import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHmac } from "crypto";

function verifyRazorpaySignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = createHmac("sha256", secret).update(body).digest("hex");
  return expectedSignature === signature;
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      );
    }

    if (!verifyRazorpaySignature(body, signature, webhookSecret)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    const eventId = event.event_id;

    // Check for idempotency
    const existingLog = await prisma.notificationLog.findFirst({
      where: {
        type: "webhook_razorpay",
        resendId: eventId,
      },
    });

    if (existingLog) {
      return NextResponse.json({ received: true, skipped: "duplicate" });
    }

    const eventType = event.event;

    switch (eventType) {
      case "subscription.activated": {
        const subscription = event.payload.subscription?.entity;
        const razorpaySubId = subscription?.id;
        const notes = subscription?.notes || {};
        const userId = notes.userId;
        const planId = notes.planId;
        const billingInterval = notes.billingInterval || "monthly";

        if (razorpaySubId && userId && planId) {
          const now = new Date();
          const periodEnd = new Date(now);
          if (billingInterval === "annual") {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          await prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              planId,
              status: "active",
              billingInterval,
              paymentProvider: "razorpay",
              razorpaySubscriptionId: razorpaySubId,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
            update: {
              status: "active",
              razorpaySubscriptionId: razorpaySubId,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          });
        }
        break;
      }

      case "subscription.charged": {
        const chargedSub = event.payload.subscription?.entity;
        const chargedSubId = chargedSub?.id;

        if (chargedSubId) {
          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          await prisma.subscription.updateMany({
            where: { razorpaySubscriptionId: chargedSubId },
            data: {
              status: "active",
              currentPeriodEnd: periodEnd,
            },
          });
        }
        break;
      }

      case "subscription.completed":
      case "subscription.cancelled": {
        const completedSub = event.payload.subscription?.entity;
        const completedSubId = completedSub?.id;

        if (completedSubId) {
          await prisma.subscription.updateMany({
            where: { razorpaySubscriptionId: completedSubId },
            data: { status: "canceled", canceledAt: new Date() },
          });
        }
        break;
      }

      case "payment.failed": {
        const failedPayment = event.payload.payment?.entity;
        const failedSubId = failedPayment?.subscription_id;

        if (failedSubId) {
          await prisma.subscription.updateMany({
            where: { razorpaySubscriptionId: failedSubId },
            data: { status: "past_due" },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled Razorpay webhook event: ${eventType}`);
    }

    // Log webhook receipt for idempotency
    await prisma.notificationLog.create({
      data: {
        userId: event.payload.subscription?.entity?.notes?.userId || "unknown",
        type: "webhook_razorpay",
        email: "",
        subject: `Razorpay Webhook: ${eventType}`,
        body: JSON.stringify(event),
        resendId: eventId,
        deliveryStatus: "sent",
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
