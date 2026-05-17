import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: NextRequest,
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

    // Verify the reminder belongs to this user's invoice
    const reminder = await prisma.reminder.findUnique({
      where: { id: params.id },
      include: { invoice: { select: { userId: true, id: true } } },
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

    // Pause the entire reminder sequence on the invoice
    await prisma.invoice.update({
      where: { id: reminder.invoice.id },
      data: { reminderPaused: true },
    });

    return NextResponse.json({ success: true, data: { paused: true } });
  } catch (error) {
    console.error("Error pausing reminders:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to pause reminders" } },
      { status: 500 }
    );
  }
}
