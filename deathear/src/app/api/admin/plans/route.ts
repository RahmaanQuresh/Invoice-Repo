import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {    const plans = await prisma.subscriptionPlan.findMany({
	      orderBy: { sortOrder: "asc" },
	    });

    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }	try {
	    const body = await req.json();
	    const {
	      name,
	      slug,
	      priceMonthly,
	      priceAnnual,
	      description,
	      invoicesPerMonth,
	      clientsAllowed,
	      aiToneEnabled,
	      legalEscalationEnabled,
	      prioritySupport,
	      features,
	      sortOrder,
	    } = body;

	    if (!name || !slug || priceMonthly === undefined) {
	      return NextResponse.json(
	        { success: false, error: "Name, slug, and priceMonthly are required" },
	        { status: 400 }
	      );
	    }

	    const plan = await prisma.subscriptionPlan.create({
	      data: {
	        name,
	        slug,
	        priceMonthly,
	        priceAnnual: priceAnnual ?? priceMonthly * 10,
	        description,
	        invoicesPerMonth: invoicesPerMonth ?? 10,
	        clientsAllowed: clientsAllowed ?? 20,
	        aiToneEnabled: aiToneEnabled ?? false,
	        legalEscalationEnabled: legalEscalationEnabled ?? false,
	        prioritySupport: prioritySupport ?? false,
	        features: features ? JSON.stringify(features) : "[]",
	        sortOrder: sortOrder ?? 0,
	      },
	    });

    return NextResponse.json({ success: true, data: plan });
  } catch (error) {
    console.error("Failed to create plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create plan" },
      { status: 500 }
    );
  }
}
