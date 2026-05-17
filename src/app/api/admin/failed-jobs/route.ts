import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = search
      ? { name: { contains: search } }
      : {};

    const [jobs, total] = await Promise.all([
      prisma.failedJob.findMany({
        where,
        orderBy: { failedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.failedJob.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: jobs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Failed to fetch failed jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch failed jobs" },
      { status: 500 }
    );
  }
}
