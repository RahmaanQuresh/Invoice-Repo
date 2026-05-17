import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const overdueMin = parseInt(searchParams.get("overdueMin") || "0");
  const hasLegal = searchParams.get("hasLegal") === "true";

  try {
    const where: any = {
      userId: session.user.id,
      paidDate: null,
    };

    if (status) {
      where.status = status;
    } else {
      where.status = { in: ["sent", "overdue"] };
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
        { title: { contains: search, mode: "insensitive" } },
      ];
    }

    if (hasLegal) {
      where.legalEscalation = {
        isNot: null,
        status: { notIn: ["canceled"] },
      };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        legalEscalation: { select: { id: true, status: true } },
        reminders: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { dueDate: "asc" },
    });

    let filteredInvoices = invoices;

    // Filter by overdue minimum (applied in-memory since it's a computed value)
    if (overdueMin > 0) {
      const now = new Date();
      filteredInvoices = invoices.filter((inv: any) => {
        const daysOverdue = Math.floor(
          (now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysOverdue >= overdueMin;
      });
    }

    return NextResponse.json({
      data: filteredInvoices.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.client?.name || "Unknown",
        client: inv.client,
        total: inv.total,
        status: inv.status,
        dueDate: inv.dueDate.toISOString(),
        reminderEnabled: inv.reminderEnabled,
        reminderPaused: inv.reminderPaused,
        currentReminderStep: inv.currentReminderStep,
        reminderSequence: inv.reminderSequence,
        legalEscalation: inv.legalEscalation,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch collections data" } },
      { status: 500 }
    );
  }
}
