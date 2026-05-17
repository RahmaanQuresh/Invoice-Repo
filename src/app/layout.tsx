import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/shared/providers";

export const metadata: Metadata = {
  title: {
    default: "DeathFear — Never chase a payment again",
    template: "%s | DeathFear",
  },
  description:
    "DeathFear helps freelancers recover unpaid invoices with automated reminders, AI tone matching, and legal escalation.",
  keywords: [
    "freelance",
    "invoices",
    "payment recovery",
    "invoice reminders",
    "freelancer tools",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
