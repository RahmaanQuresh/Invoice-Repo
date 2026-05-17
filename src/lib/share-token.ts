import crypto from "crypto";
import { prisma } from "@/lib/db";

export function generateShareToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createInvoiceShare(invoiceId: string, expiresInDays?: number) {
  const token = generateShareToken();

  const share = await prisma.invoiceShare.create({
    data: {
      invoiceId,
      token,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null,
    },
  });

  return share;
}

export async function getInvoiceByShareToken(token: string) {
  const share = await prisma.invoiceShare.findUnique({
    where: { token },
    include: {
      invoice: {
        include: {
          client: true,
          user: true,
        },
      },
    },
  });

  if (!share) return null;

  // Check if expired
  if (share.expiresAt && new Date() > share.expiresAt) {
    return null;
  }

  // Update view tracking
  await prisma.invoiceShare.update({
    where: { id: share.id },
    data: {
      lastViewedAt: new Date(),
      viewCount: { increment: 1 },
    },
  });

  // Update invoice status to 'viewed' if it was 'sent'
  if (share.invoice.status === "sent") {
    await prisma.invoice.update({
      where: { id: share.invoice.id },
      data: { status: "viewed" },
    });
  }

  return share;
}
