import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { planId, billingInterval, paymentProvider } = body;

    if (!planId || !billingInterval || !paymentProvider) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Missing required fields: planId, billingInterval, paymentProvider" } },
        { status: 422 }
      );
    }

    if (!["monthly", "annual"].includes(billingInterval)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "billingInterval must be 'monthly' or 'annual'" } },
        { status: 422 }
      );
    }

    if (!["stripe", "paypal", "razorpay"].includes(paymentProvider)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "paymentProvider must be 'stripe', 'paypal', or 'razorpay'" } },
        { status: 422 }
      );
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Plan not found or inactive" } },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    if (paymentProvider === "stripe") {
      const priceId = billingInterval === "monthly" ? plan.stripePriceIdMonthly : plan.stripePriceIdAnnual;

      if (!priceId) {
        return NextResponse.json(
          { success: false, error: { code: "CONFIG_ERROR", message: "Stripe price not configured for this plan" } },
          { status: 500 }
        );
      }

      let stripeCustomerId = user.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email!,
          name: user.name || undefined,
          metadata: { userId: user.id },
        });
        stripeCustomerId = customer.id;
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId },
        });
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/dashboard?subscription=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/subscribe?subscription=canceled`,
        metadata: {
          userId: user.id,
          planId,
          billingInterval,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          url: checkoutSession.url,
          sessionId: checkoutSession.id,
        },
      });
    }

    if (paymentProvider === "paypal") {
      const paypalPlanId = billingInterval === "monthly" ? plan.paypalPlanIdMonthly : plan.paypalPlanIdAnnual;

      if (!paypalPlanId) {
        return NextResponse.json(
          { success: false, error: { code: "CONFIG_ERROR", message: "PayPal plan not configured for this plan" } },
          { status: 500 }
        );
      }

      const { getPayPalAccessToken, PAYPAL_API_BASE } = await import("@/lib/paypal");
      const accessToken = await getPayPalAccessToken();

      const subscriptionResponse = await fetch(
        `${PAYPAL_API_BASE}/v1/billing/subscriptions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            plan_id: paypalPlanId,
            application_context: {
              brand_name: "DeathFear",
              locale: "en-US",
              shipping_preference: "NO_SHIPPING",
              user_action: "SUBSCRIBE_NOW",
              return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paypal?userId=${user.id}&planId=${planId}&billingInterval=${billingInterval}`,
              cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/subscribe?subscription=canceled`,
            },
          }),
        }
      );

      const subscriptionData = await subscriptionResponse.json();

      if (!subscriptionResponse.ok) {
        console.error("PayPal subscription creation failed:", subscriptionData);
        return NextResponse.json(
          { success: false, error: { code: "PAYMENT_FAILED", message: "Failed to create PayPal subscription" } },
          { status: 500 }
        );
      }

      const approvalUrl = subscriptionData.links?.find(
        (link: { rel: string }) => link.rel === "approve"
      )?.href;

      return NextResponse.json({
        success: true,
        data: {
          url: approvalUrl,
          subscriptionId: subscriptionData.id,
        },
      });
    }

    if (paymentProvider === "razorpay") {
      const razorpayPlanId = plan.razorpayPlanId;

      if (!razorpayPlanId) {
        return NextResponse.json(
          { success: false, error: { code: "CONFIG_ERROR", message: "Razorpay plan not configured for this plan" } },
          { status: 500 }
        );
      }

      const Razorpay = (await import("razorpay")).default;
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || "",
        key_secret: process.env.RAZORPAY_KEY_SECRET || "",
      });

      const razorpaySubscription = await razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        total_count: billingInterval === "monthly" ? 12 : 1,
        customer_notify: 1,
        notify_info: {
          notify_email: user.email!,
        },
        notes: {
          userId: user.id,
          planId,
          billingInterval,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          subscriptionId: razorpaySubscription.id,
          shortUrl: razorpaySubscription.short_url,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Unsupported payment provider" } },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create subscription" } },
      { status: 500 }
    );
  }
}
