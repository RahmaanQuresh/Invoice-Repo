import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.toneSample.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }    const body = await req.json();
	    const { originalText, context } = body;

	    const sample = await prisma.toneSample.update({
	      where: { id: params.id },
	      data: {
	        ...(originalText && { originalText }),
	        ...(context !== undefined && { context }),
	      },
	    });

    return NextResponse.json({ success: true, data: sample });
  } catch (error) {
    console.error("Failed to update tone sample:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update tone sample" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.toneSample.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    await prisma.toneSample.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("Failed to delete tone sample:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete tone sample" },
      { status: 500 }
    );
  }
}
