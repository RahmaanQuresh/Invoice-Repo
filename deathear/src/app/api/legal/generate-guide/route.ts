import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import smallClaimsData from "@/data/small-claims-data.json";
import { GuideSection } from "@/types/reminder";

const generateGuideSchema = z.object({
  invoiceId: z.string().min(1),
  country: z.string().min(1),
  state: z.string().min(1),
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
    const parsed = generateGuideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message || "Invalid input" } },
        { status: 422 }
      );
    }

    const { invoiceId, country, state } = parsed.data;

    // Check Premium
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: { plan: true },
    });

    if (!subscription?.plan?.legalEscalationEnabled) {
      return NextResponse.json(
        { success: false, error: { code: "PAYMENT_REQUIRED", message: "Legal escalation requires a Premium plan" } },
        { status: 402 }
      );
    }

    // Verify invoice
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: session.user.id, deletedAt: null },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } },
        { status: 404 }
      );
    }

    // Check jurisdiction data
    const countryData = (smallClaimsData as Record<string, any>)[country];
    if (!countryData) {
      return NextResponse.json({
        success: true,
        data: {
          guide: [
            {
              title: "Jurisdiction Not Available",
              content: `Small claims guide is not yet available for ${country}. We recommend consulting with a local attorney.`,
            },
          ],
        },
      });
    }

    const stateData = countryData[state];
    if (!stateData) {
      return NextResponse.json({
        success: true,
        data: {
          guide: [
            {
              title: "State/Region Not Available",
              content: `Small claims guide is not yet available for ${state}, ${country}. We recommend consulting with a local attorney.`,
            },
          ],
        },
      });
    }

    const amount = Number(invoice.amount);
    const isEligible = amount <= (stateData.maxClaimAmount || 99999);

    const guide: GuideSection[] = [
      {
        title: "Eligibility Check",
        content: isEligible
          ? `Your claim of $${amount.toFixed(2)} is within the ${state} small claims limit of $${stateData.maxClaimAmount?.toLocaleString() || "unlimited"}. You are eligible to file in small claims court.`
          : `Your claim of $${amount.toFixed(2)} exceeds the ${state} small claims limit of $${stateData.maxClaimAmount?.toLocaleString() || "N/A"}. You may need to file in a higher court or split the claim.`,
      },
      {
        title: "Court Information",
        content: `Court: ${stateData.courtName || "Local Small Claims Court"}\nFiling Fee: $${stateData.filingFee || "Varies"}\nForm: ${stateData.formName || "Small Claims Complaint Form"}`,
      },
      {
        title: "Filing Instructions",
        content: `1. Obtain the required form: ${stateData.formName || "Small Claims Complaint Form"}\n2. Fill out the form with your information and the details of your claim\n3. File the form with the clerk of court\n4. Pay the filing fee of $${stateData.filingFee || "the applicable amount"}\n5. The clerk will assign a court date\n\nForm URL: ${stateData.formUrl || "Contact your local court for the required forms"}`,
      },
      {
        title: "Serving the Defendant",
        content: `In ${state}, you can serve the defendant using one of the following methods:\n- ${(stateData.serverOptions as string[])?.join("\n- ") || "Certified mail or personal service by a sheriff or process server"}`,
      },
      {
        title: "Court Date Preparation",
        content: `Before your court date:\n1. Gather all evidence: invoices, contracts, email communications, and payment records\n2. Bring 3 copies of everything (you, the defendant, the judge)\n3. Prepare a brief statement of your case\n4. Arrive early and dress professionally\n5. Be respectful to the judge and the defendant`,
      },
      {
        title: "After You Win",
        content: `If the judge rules in your favor:\n1. You'll receive a judgment order\n2. If the defendant doesn't pay, you may need to garnish wages or place a lien on property\n3. Consult with the clerk of court for enforcement options in ${state}\n\nNotes: ${stateData.notes || "Consult with a local attorney for specific guidance on enforcement."}`,
      },
    ];

    // Update legal escalation
    await prisma.legalEscalation.upsert({
      where: { invoiceId: invoice.id },
      update: {
        smallClaimsGuideGenerated: true,
        smallClaimsGuideContent: JSON.stringify(guide),
        smallClaimsGuideState: `${state}, ${country}`,
        status: "small_claims_guide_generated",
      },
      create: {
        invoiceId: invoice.id,
        userId: session.user.id,
        smallClaimsGuideGenerated: true,
        smallClaimsGuideContent: JSON.stringify(guide),
        smallClaimsGuideState: `${state}, ${country}`,
        status: "small_claims_guide_generated",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        guide,
        disclaimer:
          "This guide is for informational purposes only and does not constitute legal advice. Consult with a licensed attorney for advice specific to your situation.",
      },
    });
  } catch (error) {
    console.error("Error generating guide:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to generate guide" } },
      { status: 500 }
    );
  }
}
