"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface AdminSubscription {
  id: string;
  status: string;
  billingInterval: string;
  paymentProvider: string;
  currentPeriodEnd: string;
  plan: { name: string; slug: string };
  user: { name: string; email: string };
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        if (data.success) {
          // Filter users with subscriptions
          const subs = data.data
            .filter((u: any) => u.subscription)
            .map((u: any) => ({
              id: u.subscription.id,
              status: u.subscription.status,
              billingInterval: u.subscription.billingInterval,
              paymentProvider: u.subscription.paymentProvider,
              currentPeriodEnd: u.subscription.currentPeriodEnd,
              plan: u.subscription.plan,
              user: { name: u.name, email: u.email },
            }));
          setSubscriptions(subs);
        }
      } catch {
        toast.error("Failed to load subscriptions");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="mt-2 text-muted-foreground">Manage user subscriptions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions ({subscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Billing</th>
                  <th className="pb-3 font-medium">Provider</th>
                  <th className="pb-3 font-medium">Next Billing</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b last:border-0">
                    <td className="py-3">
                      <div>{sub.user.name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{sub.user.email}</div>
                    </td>
                    <td className="py-3 font-medium">{sub.plan.name}</td>
                    <td className="py-3">
                      <Badge variant={
                        sub.status === "active" ? "default" :
                        sub.status === "past_due" ? "destructive" : "secondary"
                      }>
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="py-3 capitalize">{sub.billingInterval}</td>
                    <td className="py-3 capitalize">{sub.paymentProvider}</td>
                    <td className="py-3 text-muted-foreground">
                      {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
