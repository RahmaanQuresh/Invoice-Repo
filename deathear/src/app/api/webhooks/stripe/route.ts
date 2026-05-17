import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        const billingInterval = session.metadata?.billingInterval;
        const stripeSubscriptionId = session.subscription;

        if (!userId || !planId || !stripeSubscriptionId) {
          console.error("Missing metadata in checkout.session.completed");
          break;
        }

        // Get subscription details from Stripe
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            planId,
            status: "active",
            billingInterval: billingInterval || "monthly",
            paymentProvider: "stripe",
            stripeSubscriptionId,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          },
          update: {
            planId,
            status: "active",
            billingInterval: billingInterval || "monthly",
            stripeSubscriptionId,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            canceledAt: null,
          },
        });

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const sub = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
          });

          if (sub) {
            // Update period end
            const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
            await prisma.subscription.update({
              where: { id: sub.id },
              data: {
                status: "active",
                currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subUpdated = event.data.object as any;
        const stripeSubId = subUpdated.id;

        const existingSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSubId },
        });

        if (existingSub) {
          await prisma.subscription.update({
            where: { id: existingSub.id },
            data: {
              status: subUpdated.status === "active" ? "active" :
                     subUpdated.status === "past_due" ? "past_due" :
                     subUpdated.status === "canceled" ? "canceled" : existingSub.status,
              currentPeriodEnd: new Date(subUpdated.current_period_end * 1000),
              canceledAt: subUpdated.cancel_at_period_end ? null : existingSub.canceledAt,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subDeleted = event.data.object as any;
        const deletedSubId = subDeleted.id;

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: deletedSubId },
          data: { status: "canceled", canceledAt: new Date() },
        });
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
