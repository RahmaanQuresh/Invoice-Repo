import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";

    const logs = await prisma.notificationLog.findMany({
      where: search ? {
        OR: [
          { email: { contains: search,  } },
          { subject: { contains: search,  } },
        ],
      } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch email logs" } },
      { status: 500 }
    );
  }
}
