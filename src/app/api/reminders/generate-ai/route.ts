import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateAIReminder } from "@/lib/openai";
import { prisma } from "@/lib/db";
import { z } from "zod";

const generateAiSchema = z.object({
  invoiceId: z.string().min(1),
  stepNumber: z.number().int().min(1).max(4),
  tone: z.enum(["casual", "formal", "informal", "legal"]),
  currentMessage: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = generateAiSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message || "Invalid input" } },
        { status: 422 }
      );
    }

    const { invoiceId, stepNumber, tone, currentMessage } = parsed.data;

    // Verify invoice ownership
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: session.user.id, deletedAt: null },
      include: { client: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } },
        { status: 404 }
      );
    }

    // Check if user has Premium for AI generation
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: { plan: true },
    });

    const isPremium = subscription?.plan?.aiToneEnabled === true;

    // Get active tone sample
    const toneSample = await prisma.toneSample.findFirst({
      where: { userId: session.user.id, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    let generatedMessage = currentMessage;
    let wasAIGenerated = false;

    if (isPremium && toneSample) {
      generatedMessage = await generateAIReminder(
        toneSample.originalText,
        currentMessage,
        tone
      );
      wasAIGenerated = true;
    }

    // Build the full reminder with subject
    const subject = getSubjectForTone(tone, invoice.invoiceNumber);

    return NextResponse.json({
      success: true,
      data: {
        subject,
        message: generatedMessage,
        wasAIGenerated,
        tone,
        stepNumber,
      },
    });
  } catch (error) {
    console.error("Error generating AI reminder:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to generate reminder" } },
      { status: 500 }
    );
  }
}

function getSubjectForTone(tone: string, invoiceNumber: string): string {
  const subjects: Record<string, string> = {
    casual: `Quick heads up about invoice ${invoiceNumber}`,
    formal: `Payment Reminder: Invoice ${invoiceNumber} Due`,
    informal: `Following up on invoice ${invoiceNumber}`,
    legal: `FINAL NOTICE: Invoice ${invoiceNumber} — Outstanding Balance`,
  };
  return subjects[tone] || `Reminder: Invoice ${invoiceNumber}`;
}
