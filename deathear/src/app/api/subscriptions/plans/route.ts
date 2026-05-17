import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }	    const plans = await prisma.subscriptionPlan.findMany({
	      where: { isActive: true },
	      orderBy: { sortOrder: "asc" },
	    });

	    const parsed = plans.map((plan) => ({
	      ...plan,
	      features: JSON.parse(plan.features || "[]"),
	    }));

	    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch plans" } },
      { status: 500 }
    );
  }
}
