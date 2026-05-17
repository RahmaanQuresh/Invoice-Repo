import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const escalations = await prisma.legalEscalation.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          status: true,
          dueDate: true,
          client: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const data = escalations.map((esc) => {
    const daysSinceDue = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(esc.invoice.dueDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    return {
      id: esc.id,
      status: esc.status,
      createdAt: esc.createdAt.toISOString(),
      updatedAt: esc.updatedAt.toISOString(),
      formalLetterSentAt: esc.formalLetterSentAt?.toISOString() || null,
      invoice: {
        id: esc.invoice.id,
        invoiceNumber: esc.invoice.invoiceNumber,
        total: esc.invoice.amount,
        status: esc.invoice.status,
        dueDate: esc.invoice.dueDate.toISOString(),
        clientName: esc.invoice.client?.name || "Unknown",
        daysOverdue: daysSinceDue,
      },
    };
  });

  return NextResponse.json({ data });
}
