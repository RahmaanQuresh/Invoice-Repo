import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const samples = await prisma.toneSample.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: samples });
  } catch (error) {
    console.error("Failed to fetch tone samples:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tone samples" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();    const { originalText, context } = body;

	    if (!originalText) {
      return NextResponse.json(
        { success: false, error: "Name and content are required" },
        { status: 400 }
      );
    }    const sample = await prisma.toneSample.create({
	      data: {
	        originalText,
	        context,
	        userId: session.user.id,
	      },
	    });

    return NextResponse.json({ success: true, data: sample });
  } catch (error) {
    console.error("Failed to create tone sample:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create tone sample" },
      { status: 500 }
    );
  }
}
