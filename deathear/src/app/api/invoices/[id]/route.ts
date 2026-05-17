import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { invoiceSchema } from "@/schemas/invoice";

export async function GET(
  _request: NextRequest,
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
      include: {
        client: {
          select: { id: true, name: true, email: true, company: true, phone: true },
        },
        reminders: {
          orderBy: { stepNumber: "asc" },
        },
        legalEscalation: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Error getting invoice:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to get invoice" } },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = invoiceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid invoice data",
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 422 }
      );
    }

    const data = validation.data;

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, userId: session.user.id },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Client not found" } },
        { status: 404 }
      );
    }

    // Calculate totals
    const subtotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = subtotal * (data.discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (data.taxRate / 100);
    const total = afterDiscount + taxAmount;

    // Adjust client totals
    const amountDiff = Math.round(total * 100) / 100 - existing.amount;
    await prisma.client.update({
      where: { id: data.clientId },
      data: { totalInvoiced: { increment: amountDiff } },
    });

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        clientId: data.clientId,
        invoiceNumber: data.invoiceNumber,
        title: data.title,
        amount: Math.round(total * 100) / 100,
        dueDate: new Date(data.dueDate),
        lineItems: data.lineItems as any,
        notes: data.notes || null,
        reminderEnabled: data.reminderEnabled,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, company: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update invoice" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    // Soft delete
    await prisma.invoice.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete invoice" } },
      { status: 500 }
    );
  }
}
