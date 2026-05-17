import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientSchema } from "@/schemas/client";

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

    const client = await prisma.client.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        _count: { select: { invoices: true } },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Client not found" } },
        { status: 404 }
      );
    }

    const data = {
      ...client,
      invoiceCount: client._count.invoices,
      balance: client.totalInvoiced - client.totalPaid,
      _count: undefined,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error getting client:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to get client" } },
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

    const existing = await prisma.client.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Client not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = clientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid client data",
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 422 }
      );
    }

    const duplicateEmail = await prisma.client.findFirst({
      where: {
        userId: session.user.id,
        email: validation.data.email,
        id: { not: params.id },
      },
    });

    if (duplicateEmail) {
      return NextResponse.json(
        { success: false, error: { code: "CONFLICT", message: "Another client with this email already exists" } },
        { status: 409 }
      );
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        name: validation.data.name,
        email: validation.data.email,
        company: validation.data.company || null,
        phone: validation.data.phone || null,
        notes: validation.data.notes || null,
      },
    });

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update client" } },
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

    const client = await prisma.client.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Client not found" } },
        { status: 404 }
      );
    }

    const invoiceCount = await prisma.invoice.count({
      where: { clientId: params.id },
    });

    if (invoiceCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: `Cannot delete client with ${invoiceCount} existing invoice(s). Remove or reassign invoices first.`,
          },
        },
        { status: 409 }
      );
    }

    await prisma.client.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete client" } },
      { status: 500 }
    );
  }
}
