import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(search ? {
          OR: [
            { name: { contains: search,  } },
            { email: { contains: search,  } },
          ],
        } : {}),
      },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        subscription: user.subscription ? {
          id: user.subscription.id,
          status: user.subscription.status,
          billingInterval: user.subscription.billingInterval,
          paymentProvider: user.subscription.paymentProvider,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
          plan: {
            name: user.subscription.plan.name,
            slug: user.subscription.plan.slug,
          },
        } : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch users" } },
      { status: 500 }
    );
  }
}
