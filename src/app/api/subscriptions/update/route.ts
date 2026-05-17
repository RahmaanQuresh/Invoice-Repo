import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    const { billingInterval } = body;

    if (!billingInterval || !["monthly", "annual"].includes(billingInterval)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "billingInterval must be 'monthly' or 'annual'" } },
        { status: 422 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "No active subscription found" } },
        { status: 404 }
      );
    }

    if (subscription.status !== "active") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only active subscriptions can be updated" } },
        { status: 403 }
      );
    }

    // For v1, billing interval changes take effect at next billing cycle
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { billingInterval },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Billing interval updated to ${billingInterval}. Changes will take effect at the start of your next billing period.`,
      },
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update subscription" } },
      { status: 500 }
    );
  }
}
