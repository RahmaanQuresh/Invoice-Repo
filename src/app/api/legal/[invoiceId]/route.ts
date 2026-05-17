import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const escalation = await prisma.legalEscalation.findFirst({
      where: {
        invoiceId: params.invoiceId,
        userId: session.user.id,
      },
    });

    if (!escalation) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "No legal escalation found for this invoice" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: escalation });
  } catch (error) {
    console.error("Error fetching legal escalation:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch legal escalation" } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!["paused", "canceled", "resolved", "resume"].includes(status)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid status. Must be: paused, canceled, resolved, or resume" } },
        { status: 422 }
      );
    }

    const escalation = await prisma.legalEscalation.findFirst({
      where: { invoiceId: params.invoiceId, userId: session.user.id },
    });

    if (!escalation) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "No legal escalation found" } },
        { status: 404 }
      );
    }

    const newStatus = status === "resume" ? "letter_generated" : status;

    const updated = await prisma.legalEscalation.update({
      where: { id: escalation.id },
      data: { status: newStatus },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating legal escalation:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update legal escalation" } },
      { status: 500 }
    );
  }
}
