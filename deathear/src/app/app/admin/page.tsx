"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { Users, CreditCard, FileText, Mail } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  emailsSent: number;
  mrr: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch {
        console.error("Failed to load admin stats");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <DetailSkeleton />;

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      sub: `${stats?.freeUsers || 0} free · ${stats?.premiumUsers || 0} premium`,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "MRR",
      value: `$${stats?.mrr || 0}`,
      sub: "Monthly recurring revenue",
      icon: CreditCard,
      color: "text-green-600",
    },
    {
      title: "Invoices",
      value: stats?.totalInvoices || 0,
      sub: `${stats?.paidInvoices || 0} paid · ${stats?.overdueInvoices || 0} overdue`,
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "Emails Sent",
      value: stats?.emailsSent || 0,
      sub: "Total emails delivered",
      icon: Mail,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Platform overview and management.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
