"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface AdminPlan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceAnnual: number;
  invoicesPerMonth: number;
  clientsAllowed: number;
  aiToneEnabled: boolean;
  legalEscalationEnabled: boolean;
  prioritySupport: boolean;
  isActive: boolean;
  sortOrder: number;
  features: string[];
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/subscriptions/plans");
        const data = await res.json();
        if (data.success) {
          setPlans(data.data);
        }
      } catch {
        toast.error("Failed to load plans");
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
        <h1 className="text-3xl font-bold">Plans</h1>
        <p className="mt-2 text-muted-foreground">Manage subscription plans and pricing.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <Badge variant={plan.isActive ? "default" : "secondary"}>
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Monthly:</span>
                  <span className="ml-2 font-medium">
                    {plan.priceMonthly === 0 ? "Free" : `$${plan.priceMonthly}`}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Annual:</span>
                  <span className="ml-2 font-medium">
                    {plan.priceAnnual === 0 ? "Free" : `$${plan.priceAnnual}`}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Invoices/month:</span>
                  <span className="ml-2 font-medium">
                    {plan.invoicesPerMonth === 0 ? "Unlimited" : plan.invoicesPerMonth}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Clients:</span>
                  <span className="ml-2 font-medium">
                    {plan.clientsAllowed === 0 ? "Unlimited" : plan.clientsAllowed}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {plan.aiToneEnabled && <Badge variant="outline">AI Tone</Badge>}
                {plan.legalEscalationEnabled && <Badge variant="outline">Legal</Badge>}
                {plan.prioritySupport && <Badge variant="outline">Priority Support</Badge>}
              </div>

              <ul className="space-y-1 text-sm text-muted-foreground">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
