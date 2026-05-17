import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { invoiceSchema } from "@/schemas/invoice";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sort = searchParams.get("sort") || "createdAt_desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get("perPage") || "10")));

    const where: Record<string, unknown> = {
      userId: session.user.id,
      deletedAt: null,
    };

    if (status) {
      const statuses = status.split(",");
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const orderBy: Record<string, string> = {};
    const sortMap: Record<string, [string, string]> = {
      createdAt_desc: ["createdAt", "desc"],
      createdAt_asc: ["createdAt", "asc"],
      amount_desc: ["amount", "desc"],
      amount_asc: ["amount", "asc"],
      dueDate_desc: ["dueDate", "desc"],
      dueDate_asc: ["dueDate", "asc"],
      invoiceNumber_desc: ["invoiceNumber", "desc"],
      invoiceNumber_asc: ["invoiceNumber", "asc"],
    };
    const [sortField, sortDir] = sortMap[sort] || ["createdAt", "desc"];
    orderBy[sortField] = sortDir;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: where as any,
        orderBy: orderBy as any,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          client: {
            select: { id: true, name: true, email: true, company: true },
          },
        },
      }),
      prisma.invoice.count({ where: where as any }),
    ]);

    return NextResponse.json({
      success: true,
      data: invoices,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    });
  } catch (error) {
    console.error("Error listing invoices:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to list invoices" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
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

    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        clientId: data.clientId,
        invoiceNumber: data.invoiceNumber,
        title: data.title,
        amount: Math.round(total * 100) / 100,
        dueDate: new Date(data.dueDate),
        lineItems: data.lineItems as any,
        notes: data.notes || null,
        terms: null,
        reminderEnabled: data.reminderEnabled,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, company: true },
        },
      },
    });

    // Update client totals
    await prisma.client.update({
      where: { id: data.clientId },
      data: {
        totalInvoiced: { increment: invoice.amount },
        lastInvoiceDate: new Date(),
      },
    });

    // Set up reminder sequence if enabled
    if (data.reminderEnabled) {
      const reminderSteps = [
        { tone: "casual", daysAfterDue: data.reminderFirstAfterDays },
        { tone: "formal", daysAfterDue: data.reminderFirstAfterDays + data.reminderFrequencyDays },
        { tone: "informal", daysAfterDue: data.reminderFirstAfterDays + data.reminderFrequencyDays * 2 },
        { tone: "legal", daysAfterDue: data.reminderFirstAfterDays + data.reminderFrequencyDays * 3 },
      ];

      const firstStep = reminderSteps[0];
      const nextDate = new Date(data.dueDate);
      nextDate.setDate(nextDate.getDate() + firstStep.daysAfterDue);

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          currentReminderStep: 1,
          nextReminderDate: nextDate,
          reminderSequence: reminderSteps as any,
        },
      });
    }

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create invoice" } },
      { status: 500 }
    );
  }
}
