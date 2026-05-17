"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function SubscribePage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <SubscribeContent />
    </Suspense>
  );
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanCard } from "@/components/subscription/plan-card";
import { PaymentMethodSelector, type PaymentMethod } from "@/components/subscription/payment-method-selector";
import { UpiInput } from "@/components/subscription/upi-input";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  invoicesPerMonth: number;
  clientsAllowed: number;
  aiToneEnabled: boolean;
  legalEscalationEnabled: boolean;
  prioritySupport: boolean;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

function SubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [upiId, setUpiId] = useState("");
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  const canceled = searchParams.get("subscription") === "canceled";

  useEffect(() => {
    async function loadData() {
      try {
        const [plansRes, subRes] = await Promise.all([
          fetch("/api/subscriptions/plans"),
          fetch("/api/subscriptions/current"),
        ]);

        const plansData = await plansRes.json();
        if (plansData.success) {
          setPlans(plansData.data);
        }

        const subData = await subRes.json();
        if (subData.success) {
          setCurrentPlanId(subData.data.planId);
        }
      } catch (error) {
        console.error("Failed to load subscription data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (canceled) {
      toast.info("Subscription process was canceled. Feel free to try again.");
    }
  }, [canceled]);

  const handleSubscribe = async () => {
    if (!selectedPlan || !paymentMethod) return;

    if (paymentMethod === "razorpay" && !upiId) {
      toast.error("Please enter your UPI ID");
      return;
    }

    setSubscribing(true);

    try {
      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan,
          billingInterval,
          paymentProvider: paymentMethod,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error?.message || "Failed to create subscription");
        setSubscribing(false);
        return;
      }

      if (data.data.url) {
        window.location.href = data.data.url;
      } else if (data.data.shortUrl) {
        window.open(data.data.shortUrl, "_blank");
        toast.success("Subscription created! Complete payment via the opened link.");
        setSubscribing(false);
      } else if (data.data.subscriptionId) {
        toast.success("Subscription created successfully!");
        router.push("/app/dashboard");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Something went wrong. Please try again.");
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl py-8">
        <DetailSkeleton />
      </div>
    );
  }

  const freePlan = plans.find((p) => p.slug === "free");
  const premiumPlan = plans.find((p) => p.slug === "premium");

  return (
    <div className="container mx-auto max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/app/dashboard"
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="mt-2 text-muted-foreground">
          Start free, upgrade when you need more power.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="mb-8 flex items-center justify-center gap-4">
        <button
          onClick={() => setBillingInterval("monthly")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            billingInterval === "monthly"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingInterval("annual")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            billingInterval === "annual"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Annual
          {premiumPlan && (
            <span className="ml-1.5 text-xs opacity-80">
              (Save {Math.round((1 - premiumPlan.priceAnnual / (premiumPlan.priceMonthly * 12)) * 100)}%)
            </span>
          )}
        </button>
      </div>

      {/* Plan Cards */}
      <div className="mb-12 grid gap-8 md:grid-cols-2">
        {freePlan && (
          <PlanCard
            name={freePlan.name}
            description={freePlan.description || "Essential features to get started"}
            priceMonthly={freePlan.priceMonthly}
            priceAnnual={freePlan.priceAnnual}
            features={freePlan.features}
            isCurrentPlan={currentPlanId === freePlan.id && freePlan.slug === "free"}
            billingInterval={billingInterval}
            onSelect={() => {
              setSelectedPlan(freePlan.id);
              setPaymentMethod(null);
            }}
            loading={subscribing}
          />
        )}

        {premiumPlan && (
          <PlanCard
            name={premiumPlan.name}
            description={premiumPlan.description || "Everything you need to recover payments"}
            priceMonthly={premiumPlan.priceMonthly}
            priceAnnual={premiumPlan.priceAnnual}
            features={premiumPlan.features}
            isPopular
            isCurrentPlan={currentPlanId === premiumPlan.id}
            billingInterval={billingInterval}
            onSelect={() => setSelectedPlan(premiumPlan.id)}
            loading={subscribing}
          />
        )}
      </div>

      {/* Payment Section (shown when Premium is selected) */}
      {selectedPlan && selectedPlan !== freePlan?.id && (
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>Complete Your Subscription</CardTitle>
            <CardDescription>
              Choose your payment method to activate Premium.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-medium">Payment Method</h3>
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
            </div>

            {paymentMethod === "razorpay" && (
              <UpiInput
                value={upiId}
                onChange={setUpiId}
              />
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubscribe}
              disabled={!paymentMethod || subscribing}
            >
              {subscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Subscribe to Premium — ${
                  billingInterval === "monthly"
                    ? `$${premiumPlan?.priceMonthly}/month`
                    : `$${premiumPlan?.priceAnnual}/year`
                }`
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Your payment is processed securely. By subscribing, you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      )}

      {/* Free plan selected message */}
      {selectedPlan && selectedPlan === freePlan?.id && (
        <Card className="mx-auto max-w-lg">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-medium">Free Plan Selected</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              You&apos;re on the Free plan. You can upgrade anytime to unlock unlimited invoices,
              AI tone adaptation, legal escalation, and more.
            </p>
            <Button onClick={() => router.push("/app/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
