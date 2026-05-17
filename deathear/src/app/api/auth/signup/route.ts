import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Email and password are required." },
        },
        { status: 422 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters." },
        },
        { status: 422 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Password must contain an uppercase letter." },
        },
        { status: 422 }
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Password must contain a number." },
        },
        { status: 422 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.hashedPassword) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "CONFLICT", message: "An account with this email already exists." },
          },
          { status: 409 }
        );
      }
      // User exists with OAuth only - link accounts by adding password
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { hashedPassword, name: name || existingUser.name },
      });

      return NextResponse.json({
        success: true,
        data: { message: "Account linked successfully." },
      });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        hashedPassword,
      },
    });

    // Create free subscription plan association
    const freePlan = await prisma.subscriptionPlan.findUnique({
      where: { slug: "free" },
    });

    if (freePlan) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: freePlan.id,
          status: "active",
          billingInterval: "monthly",
          paymentProvider: "stripe",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { message: "Account created successfully." },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
      },
      { status: 500 }
    );
  }
}
