"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  Mail,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { useEffect } from "react";

const adminNavItems = [
  { href: "/app/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/admin/users", label: "Users", icon: Users },
  { href: "/app/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/app/admin/plans", label: "Plans", icon: Receipt },
  { href: "/app/admin/email-logs", label: "Email Logs", icon: Mail },
  { href: "/app/admin/failed-jobs", label: "Failed Jobs", icon: AlertTriangle },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && (session.user as any).role !== "admin") {
      router.push("/app/dashboard");
    }
  }, [status, session, router]);

  if (status !== "authenticated" || (session.user as any).role !== "admin") {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-4 hidden lg:block">
        <div className="mb-6">
          <Link
            href="/app/dashboard"
            className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to App
          </Link>
          <h2 className="mt-4 text-lg font-bold">Admin Panel</h2>
        </div>

        <nav className="space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-card z-50">
        <div className="flex overflow-x-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs min-w-[60px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 p-6 pb-20 lg:pb-6">
        {children}
      </main>
    </div>
  );
}
