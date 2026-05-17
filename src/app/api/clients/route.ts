import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientSchema } from "@/schemas/client";

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
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const sort = searchParams.get("sort") || "name";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get("perPage") || "10")));

    const where: Record<string, unknown> = { userId: session.user.id };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const orderBy: Record<string, string> = {};
    const sortMap: Record<string, [string, string]> = {
      name: ["name", "asc"],
      name_desc: ["name", "desc"],
      totalInvoiced: ["totalInvoiced", "desc"],
      totalInvoiced_asc: ["totalInvoiced", "asc"],
      lastInvoiceDate: ["lastInvoiceDate", "desc"],
      lastInvoiceDate_asc: ["lastInvoiceDate", "asc"],
      createdAt: ["createdAt", "desc"],
      createdAt_asc: ["createdAt", "asc"],
    };
    const [sortField, sortDir] = sortMap[sort] || ["name", "asc"];
    orderBy[sortField] = sortDir;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: where as any,
        orderBy: orderBy as any,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          _count: { select: { invoices: true } },
        },
      }),
      prisma.client.count({ where: where as any }),
    ]);

    const data = clients.map((client) => ({
      ...client,
      invoiceCount: client._count.invoices,
      balance: client.totalInvoiced - client.totalPaid,
      _count: undefined,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    });
  } catch (error) {
    console.error("Error listing clients:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to list clients" } },
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

    const existing = await prisma.client.findUnique({
      where: { userId_email: { userId: session.user.id, email: validation.data.email } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "CONFLICT", message: "A client with this email already exists" } },
        { status: 409 }
      );
    }

    const client = await prisma.client.create({
      data: {
        userId: session.user.id,
        name: validation.data.name,
        email: validation.data.email,
        company: validation.data.company || null,
        phone: validation.data.phone || null,
        notes: validation.data.notes || null,
      },
    });

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create client" } },
      { status: 500 }
    );
  }
}
