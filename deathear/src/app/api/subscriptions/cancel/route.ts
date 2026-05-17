import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "No active subscription found" } },
        { status: 404 }
      );
    }

    // Cancel at period end via respective provider
    if (subscription.paymentProvider === "stripe" && subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } else if (subscription.paymentProvider === "paypal" && subscription.paypalSubscriptionId) {
      const { getPayPalAccessToken, PAYPAL_API_BASE } = await import("@/lib/paypal");
      const accessToken = await getPayPalAccessToken();

      await fetch(
        `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscription.paypalSubscriptionId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            reason: "Canceled by user via DeathFear settings",
          }),
        }
      );
    } else if (subscription.paymentProvider === "razorpay" && subscription.razorpaySubscriptionId) {
      const Razorpay = (await import("razorpay")).default;
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || "",
        key_secret: process.env.RAZORPAY_KEY_SECRET || "",
      });

      await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, false);
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "canceled",
        canceledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Subscription canceled successfully. You'll retain access until the end of your billing period." },
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to cancel subscription" } },
      { status: 500 }
    );
  }
}
