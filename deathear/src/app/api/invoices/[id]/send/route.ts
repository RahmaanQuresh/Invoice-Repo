import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateShareToken } from "@/lib/share-token";

export async function POST(
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
      include: { client: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } },
        { status: 404 }
      );
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { success: false, error: { code: "CONFLICT", message: "Invoice is already paid" } },
        { status: 409 }
      );
    }

    // Create share token if not exists
    const existingShare = await prisma.invoiceShare.findUnique({
      where: { invoiceId: params.id },
    });

    if (!existingShare) {
      await prisma.invoiceShare.create({
        data: {
          invoiceId: params.id,
          token: generateShareToken(),
        },
      });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: "sent",
        sentDate: new Date(),
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, company: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedInvoice });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to send invoice" } },
      { status: 500 }
    );
  }
}
