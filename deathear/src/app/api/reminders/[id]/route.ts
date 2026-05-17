import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateReminderSchema = z.object({
  subject: z.string().min(1).max(500).optional(),
  message: z.string().min(1).optional(),
  wasEditedByUser: z.boolean().optional(),
});

export async function PUT(
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
    const parsed = updateReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message || "Invalid input" } },
        { status: 422 }
      );
    }

    // Get reminder and verify ownership through invoice
    const reminder = await prisma.reminder.findUnique({
      where: { id: params.id },
      include: { invoice: { select: { userId: true } } },
    });

    if (!reminder) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Reminder not found" } },
        { status: 404 }
      );
    }

    if (reminder.invoice.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized" } },
        { status: 403 }
      );
    }

    const updated = await prisma.reminder.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.subject !== undefined && { subject: parsed.data.subject }),
        ...(parsed.data.message !== undefined && { message: parsed.data.message }),
        ...(parsed.data.wasEditedByUser !== undefined && { wasEditedByUser: parsed.data.wasEditedByUser }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating reminder:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update reminder" } },
      { status: 500 }
    );
  }
}
