import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { markAsPaidSchema } from "@/schemas/invoice";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id, deletedAt: null },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = markAsPaidSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid payment data",
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 422 }
      );
    }

    const { paidDate, amount, paymentMethod } = validation.data;
    const newPaidAmount = invoice.paidAmount + amount;
    const isPartial = newPaidAmount < invoice.amount;

    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: isPartial ? "partially_paid" : "paid",
        paidAmount: newPaidAmount,
        paidDate: isPartial ? null : new Date(paidDate),
        reminderPaused: isPartial ? true : false,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, company: true },
        },
      },
    });

    // Update client totals
    const clientUpdate: Record<string, unknown> = {
      totalPaid: { increment: amount },
    };

    if (!isPartial) {
      clientUpdate.paymentStatus = "paid";
    } else {
      clientUpdate.paymentStatus = "partial";
    }

    await prisma.client.update({
      where: { id: invoice.clientId },
      data: clientUpdate as any,
    });

    return NextResponse.json({ success: true, data: updatedInvoice });
  } catch (error) {
    console.error("Error marking invoice as paid:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to mark as paid" } },
      { status: 500 }
    );
  }
}
