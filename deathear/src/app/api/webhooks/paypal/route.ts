import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const event = JSON.parse(body);

    // Verify webhook signature (simplified for v1)
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      console.error("PAYPAL_WEBHOOK_ID not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    // In production, verify signature using:
    // const { getPayPalAccessToken, PAYPAL_API_BASE } = await import("@/lib/paypal");
    // const accessToken = await getPayPalAccessToken();
    // Verify with PayPal's verifyWebhookSignature API

    const eventType = event.event_type;

    switch (eventType) {
      case "BILLING.SUBSCRIPTION.CREATED":
      case "PAYMENT.SALE.COMPLETED": {
        const resource = event.resource;

        // For BILLING.SUBSCRIPTION.CREATED, the subscription ID is in resource.id
        // For PAYMENT.SALE.COMPLETED, we find the billing agreement
        let subscriptionId: string | undefined;
        let state = "active";
        let userId: string | undefined;
        let planId: string | undefined;
        let billingInterval = "monthly";

        if (eventType === "BILLING.SUBSCRIPTION.CREATED") {
          subscriptionId = resource.id;
          state = resource.status?.toLowerCase() === "active" ? "active" : "pending";

          // Parse custom_id or plan_id from resource
          if (resource.custom_id) {
            const parts = resource.custom_id.split(":");
            userId = parts[0];
            planId = parts[1];
          }
        } else {
          // PAYMENT.SALE.COMPLETED - find the subscription from billing_agreement_id
          subscriptionId = resource.billing_agreement_id;
        }

        // Try to extract userId/planId from query params if this is a return redirect
        // The PayPal return URL includes: ?userId=xxx&planId=yyy&billingInterval=zzz
        const url = new URL(req.url);
        userId = userId || url.searchParams.get("userId") || undefined;
        planId = planId || url.searchParams.get("planId") || undefined;
        billingInterval = url.searchParams.get("billingInterval") || "monthly";

        if (subscriptionId && userId && planId) {
          // Check if we already have this subscription
          const existing = await prisma.subscription.findFirst({
            where: { paypalSubscriptionId: subscriptionId },
          });

          if (!existing) {
            // Get the plan to know period end
            const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
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
                status: state as any,
                billingInterval,
                paymentProvider: "paypal",
                paypalSubscriptionId: subscriptionId,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
              },
              update: {
                planId,
                status: state as any,
                paypalSubscriptionId: subscriptionId,
              },
            });
          } else {
            await prisma.subscription.update({
              where: { id: existing.id },
              data: { status: state as any },
            });
          }
        }
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED": {
        const canceledResource = event.resource;
        const canceledSubId = canceledResource.id;

        await prisma.subscription.updateMany({
          where: { paypalSubscriptionId: canceledSubId },
          data: { status: "canceled", canceledAt: new Date() },
        });
        break;
      }

      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        const suspendedResource = event.resource;
        const suspendedSubId = suspendedResource.id;

        await prisma.subscription.updateMany({
          where: { paypalSubscriptionId: suspendedSubId },
          data: { status: "past_due" },
        });
        break;
      }

      default:
        console.log(`Unhandled PayPal webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
