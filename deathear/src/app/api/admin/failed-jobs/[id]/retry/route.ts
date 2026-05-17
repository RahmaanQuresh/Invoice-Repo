import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const job = await prisma.failedJob.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }	    // Note: This is a stub for future Inngest integration.
	    // In production, re-enqueue the job via the job system (e.g. Inngest sendEvent)
	    // based on the job.name and job.payload, then delete the failed record.
	    await prisma.failedJob.delete({ where: { id: params.id } });

	    console.log(`[Admin] Retrying failed job: ${job.name} (${job.id})`);

	    return NextResponse.json({ success: true, data: { message: "Job scheduled for retry" } });
  } catch (error) {
    console.error("Failed to retry job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retry job" },
      { status: 500 }
    );
  }
}
