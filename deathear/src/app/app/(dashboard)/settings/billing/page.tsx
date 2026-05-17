"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ArrowUpRight, CreditCard, AlertTriangle } from "lucide-react";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";

interface SubscriptionData {
  id: string;
  status: string;
  billingInterval: string;
  paymentProvider: string;
  currentPeriodEnd: string;
  canceledAt: string | null;
  plan: {
    name: string;
    slug: string;
    priceMonthly: number;
    priceAnnual: number;
  };
}

export default function BillingSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/subscriptions/current");
        const data = await res.json();
        if (data.success) {
          setSubscription(data.data);
        }
      } catch {
        console.error("Failed to load subscription");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll retain access until the end of your billing period.")) {
      return;
    }

    setCanceling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Subscription canceled");
        router.refresh();
      } else {
        toast.error(data.error?.message || "Failed to cancel");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      past_due: "destructive",
      canceled: "secondary",
      incomplete: "outline",
    };
    return variants[status] || "outline";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="mt-2 text-muted-foreground">Manage your subscription and payment methods.</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription and billing details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">{subscription.plan.name}</span>
                    <Badge variant={getStatusBadge(subscription.status)}>
                      {subscription.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {subscription.billingInterval === "annual" ? "Annual" : "Monthly"} billing
                    {" · "}
                    {subscription.paymentProvider === "stripe" ? "Credit Card" :
                     subscription.paymentProvider === "paypal" ? "PayPal" : "UPI AutoPay"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {subscription.plan.slug === "free"
                      ? "Free"
                      : `$${subscription.billingInterval === "monthly" ? subscription.plan.priceMonthly : subscription.plan.priceAnnual}/${subscription.billingInterval === "monthly" ? "mo" : "yr"}`}
                  </p>
                  {subscription.currentPeriodEnd && (
                    <p className="text-xs text-muted-foreground">
                      {subscription.canceledAt
                        ? `Access until ${formatDate(subscription.currentPeriodEnd)}`
                        : `Renews ${formatDate(subscription.currentPeriodEnd)}`}
                    </p>
                  )}
                </div>
              </div>

              {subscription.status === "active" && !subscription.canceledAt && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/app/subscribe")}
                  >
                    Change Plan
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={canceling}
                  >
                    {canceling ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Cancel Subscription
                  </Button>
                </div>
              )}

              {subscription.status === "past_due" && (
                <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Payment Required</p>
                    <p className="text-sm text-muted-foreground">
                      Your last payment failed. Please update your payment method to continue using Premium features.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto shrink-0">
                    Update Payment
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No active subscription</p>
              <Button onClick={() => router.push("/app/subscribe")}>
                View Plans
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
