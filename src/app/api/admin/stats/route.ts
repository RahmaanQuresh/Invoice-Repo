import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      );
    }

    const [
      totalUsers,
      freeSubscriptions,
      premiumSubscriptions,
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      emailsSent,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.subscription.count({
        where: {
          plan: { slug: "free" },
          status: "active",
        },
      }),
      prisma.subscription.count({
        where: {
          plan: { slug: "premium" },
          status: "active",
        },
      }),
      prisma.invoice.count({ where: { deletedAt: null } }),
      prisma.invoice.count({ where: { status: "paid", deletedAt: null } }),
      prisma.invoice.count({ where: { status: "overdue", deletedAt: null } }),
      prisma.notificationLog.count(),
    ]);

    // Calculate MRR (Monthly Recurring Revenue)
    const activePremiumSubs = await prisma.subscription.findMany({
      where: {
        plan: { slug: "premium" },
        status: "active",
      },
      include: { plan: true },
    });

    const mrr = activePremiumSubs.reduce((total, sub) => {
      return total + (sub.billingInterval === "monthly" ? sub.plan.priceMonthly : sub.plan.priceMonthly);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        freeUsers: freeSubscriptions,
        premiumUsers: premiumSubscriptions,
        mrr,
        totalInvoices,
        paidInvoices,
        overdueInvoices,
        emailsSent,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch stats" } },
      { status: 500 }
    );
  }
}
