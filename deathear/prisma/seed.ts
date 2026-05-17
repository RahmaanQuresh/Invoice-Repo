import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding DeathFear database...");

  // Create subscription plans
  console.log("Creating subscription plans...");

  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "Free",
      slug: "free",
      description: "For freelancers just getting started",
      priceMonthly: 0,
      priceAnnual: 0,
      invoicesPerMonth: 3,
      clientsAllowed: 5,
      aiToneEnabled: false,
      legalEscalationEnabled: false,
      prioritySupport: false,
      features: JSON.stringify([
        "3 invoices/month",
        "5 clients",
        "Basic templates",
        "Email support",
      ]),
      sortOrder: 0,
    },
  });

  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "enterprise" },
    update: {},
    create: {
      name: "Enterprise",
      slug: "enterprise",
      description: "For growing agencies and power users",
      priceMonthly: 49.0,
      priceAnnual: 490.0,
      invoicesPerMonth: 0, // unlimited
      clientsAllowed: 0, // unlimited
      aiToneEnabled: true,
      legalEscalationEnabled: true,
      prioritySupport: true,
      features: JSON.stringify([
        "Unlimited invoices",
        "Unlimited clients",
        "AI tone adaptation",
        "Legal escalation",
        "Priority support",
        "Advanced analytics",
        "Team members (up to 5)",
        "Custom branding",
        "API access",
      ]),
      sortOrder: 2,
    },
  });

  console.log(`✓ Created plan: ${enterprisePlan.name}`);

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "premium" },
    update: {},
    create: {
      name: "Premium",
      slug: "premium",
      description: "For serious freelancers who need it all",
      priceMonthly: 19.0,
      priceAnnual: 190.0,
      invoicesPerMonth: 0, // unlimited
      clientsAllowed: 0, // unlimited
      aiToneEnabled: true,
      legalEscalationEnabled: true,
      prioritySupport: true,
      features: JSON.stringify([
        "Unlimited invoices",
        "Unlimited clients",
        "AI tone adaptation",
        "Legal escalation",
        "Priority support",
        "Analytics",
      ]),
      sortOrder: 1,
    },
  });

  console.log(`✓ Created plan: ${freePlan.name}`);
  console.log(`✓ Created plan: ${premiumPlan.name}`);

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@deathear.app";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "DeathFear Admin",
      role: "admin",
      hashedPassword,
      emailVerified: new Date(),
    },
  });

  console.log(`✓ Created admin user: ${admin.email}`);

  // Create admin subscription
  await prisma.subscription.upsert({
    where: { userId: admin.id },
    update: {
      planId: premiumPlan.id,
    },
    create: {
      userId: admin.id,
      planId: premiumPlan.id,
      status: "active",
      billingInterval: "monthly",
      paymentProvider: "stripe",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✓ Admin has Premium subscription");

  // Seed sample failed jobs for admin panel demo
  console.log("Creating sample failed jobs...");

  const failedJobs = [
    {
      name: "send-reminder-email",
      payload: JSON.stringify({ invoiceId: "demo-invoice-1", userId: admin.id }),
      error: "Resend API rate limit exceeded (429)",
      failedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      retryCount: 3,
    },
    {
      name: "process-paypal-webhook",
      payload: JSON.stringify({ eventType: "PAYMENT.SALE.COMPLETED", resourceId: "demo-resource-1" }),
      error: "Webhook signature verification failed",
      failedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      retryCount: 1,
    },
    {
      name: "generate-legal-letter",
      payload: JSON.stringify({ invoiceId: "demo-invoice-2", userId: admin.id }),
      error: "OpenAI API timeout after 30s",
      failedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      retryCount: 2,
    },
    {
      name: "sync-stripe-subscription",
      payload: JSON.stringify({ subscriptionId: "sub_demo_123", userId: admin.id }),
      error: "Stripe customer not found",
      failedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      retryCount: 0,
    },
    {
      name: "send-invoice-notification",
      payload: JSON.stringify({ invoiceId: "demo-invoice-3", type: "overdue" }),
      error: "Notification log insert failed: UNIQUE constraint",
      failedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      retryCount: 5,
    },
  ];

  for (const job of failedJobs) {
    await prisma.failedJob.create({ data: job });
    console.log(`  ✓ Failed job: ${job.name}`);
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
