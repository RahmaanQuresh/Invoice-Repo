"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PlanLimitModal } from "./plan-limit-modal";

interface PlanLimits {
  invoicesPerMonth: number;
  remindersPerMonth: number;
  clients: number;
  aiReminders: boolean;
  legalLetters: boolean;
  collections: boolean;
  teamMembers: number;
}

interface PlanLimitGateProps {
  children: React.ReactNode;
  resource: keyof PlanLimits;
  feature?: boolean;
  current?: number;
}

export function PlanLimitGate({ children, resource, feature, current }: PlanLimitGateProps) {
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [planName, setPlanName] = useState("Free");
  const router = useRouter();

  const [limitValue, setLimitValue] = useState(10);

  const checkLimits = async () => {
    try {
      // Fetch both the user's subscription and free plan for fallback defaults
      const [subRes, plansRes] = await Promise.all([
        fetch("/api/subscriptions/current"),
        fetch("/api/subscriptions/plans"),
      ]);

      const subData = await subRes.json();
      const plansData = await plansRes.json();

      // Find the free plan to get actual default limits
      const freePlan = plansData.success
        ? plansData.data?.find((p: { slug: string }) => p.slug === "free")
        : null;

      // Map SubscriptionPlan fields to PlanLimits interface
      const mapPlanToLimits = (plan: Record<string, unknown> | null): PlanLimits => ({
        invoicesPerMonth: (plan?.invoicesPerMonth as number) ?? 10,
        remindersPerMonth: 50,
        clients: (plan?.clientsAllowed as number) ?? 20,
        aiReminders: (plan?.aiToneEnabled as boolean) ?? false,
        legalLetters: (plan?.legalEscalationEnabled as boolean) ?? false,
        collections: false,
        teamMembers: 1,
      });

      // Use user's plan limits, falling back to free plan, then hardcoded defaults
      const userPlan = subData.success ? subData.data?.plan : null;
      const effectivePlan = userPlan || freePlan || null;
      const resolvedPlanName = userPlan?.name || freePlan?.name || "Free";
      setPlanName(resolvedPlanName);

      const limits = mapPlanToLimits(effectivePlan);
      const resolvedLimit = limits[resource];
      if (typeof resolvedLimit === "number") {
        setLimitValue(resolvedLimit);
      }

      // Check feature gate
      if (feature && !resolvedLimit) {
        setBlocked(true);
        setLoading(false);
        return;
      }

      // Check numeric limit
      if (current !== undefined && typeof resolvedLimit === "number") {
        if (current >= resolvedLimit) {
          setBlocked(true);
          setLoading(false);
          return;
        }
      }

      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLimits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (blocked) {
    const limitTypeMap: Partial<Record<keyof PlanLimits, "invoices" | "clients">> = {
      invoicesPerMonth: "invoices",
      clients: "clients",
    };

    return (
      <PlanLimitModal
        open={true}
        onOpenChange={() => router.push("/app/subscribe")}
        limitType={limitTypeMap[resource] || "invoices"}
        currentCount={current ?? 0}
        maxCount={limitValue}
      />
    );
  }

  return <>{children}</>;
}
