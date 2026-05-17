import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token || token.length < 10) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Invalid share token" } },
        { status: 404 }
      );
    }

    const share = await prisma.invoiceShare.findUnique({
      where: { token },
      include: {
        invoice: {
          include: {
            client: true,
            user: {
              select: {
                name: true,
                email: true,
                paymentLink: true,
              },
            },
          },
        },
      },
    });

    if (!share) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Invoice not found. The link may be invalid or expired." } },
        { status: 404 }
      );
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "This link has expired. Please contact the sender for a new link." } },
        { status: 410 }
      );
    }

    // Update view tracking
    await prisma.invoiceShare.update({
      where: { id: share.id },
      data: {
        lastViewedAt: new Date(),
        viewCount: { increment: 1 },
      },
    });

    // Update invoice status to "viewed" if it was "sent"
    if (share.invoice.status === "sent") {
      await prisma.invoice.update({
        where: { id: share.invoiceId },
        data: { status: "viewed" },
      });
    }

    const invoice = share.invoice;

    return NextResponse.json({
      success: true,
      data: {
        invoiceNumber: invoice.invoiceNumber,
        title: invoice.title,
        amount: invoice.amount,
        paidAmount: invoice.paidAmount,
        status: invoice.status,
        dueDate: invoice.dueDate,
        issueDate: invoice.sentDate || invoice.createdAt,
        currency: invoice.currency,
        lineItems: invoice.lineItems,
        notes: invoice.notes,
        terms: invoice.terms,
        client: {
          name: invoice.client.name,
          company: invoice.client.company,
          email: invoice.client.email,
        },
        freelancer: {
          name: invoice.user.name,
          email: invoice.user.email,
          paymentLink: invoice.user.paymentLink,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching shared invoice:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to load invoice" } },
      { status: 500 }
    );
  }
}
