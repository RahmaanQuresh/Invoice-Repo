import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const collectionsSchema = z.object({
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const parsed = collectionsSchema.safeParse(body);
    const notes = parsed.success ? parsed.data.notes : undefined;

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

    if (invoice.status === "paid" || invoice.status === "canceled") {
      return NextResponse.json(
        { success: false, error: { code: "CONFLICT", message: "Invoice is already paid or canceled" } },
        { status: 409 }
      );
    }

    const [updatedInvoice] = await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "overdue",
          reminderPaused: false,
          notes: notes ? `${invoice.notes || ""}\n\n[Collections] ${notes}` : invoice.notes,
        },
      }),
      prisma.client.update({
        where: { id: invoice.clientId },
        data: { paymentStatus: "collections" },
      }),
      prisma.notificationLog.create({
        data: {
          userId: session.user.id,
          type: "collections_started",
          email: invoice.client.email,
          subject: `Invoice ${invoice.invoiceNumber} moved to collections`,
          body: `Invoice ${invoice.invoiceNumber} for ${invoice.client.name} has been moved to collections.`,
          metadata: JSON.stringify({ invoiceId: invoice.id, notes: notes || null }),
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: updatedInvoice });
  } catch (error) {
    console.error("Error moving to collections:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to move to collections" } },
      { status: 500 }
    );
  }
}
