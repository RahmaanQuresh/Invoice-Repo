"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface PlanCardProps {
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  billingInterval: "monthly" | "annual";
  onSelect: (billingInterval: "monthly" | "annual") => void;
  loading?: boolean;
}

export function PlanCard({
  name,
  description,
  priceMonthly,
  priceAnnual,
  features,
  isPopular,
  isCurrentPlan,
  billingInterval,
  onSelect,
  loading,
}: PlanCardProps) {
  const price = billingInterval === "monthly" ? priceMonthly : priceAnnual;
  const periodLabel = billingInterval === "monthly" ? "/month" : "/year";
  const annualSavings = priceMonthly > 0
    ? Math.round((1 - priceAnnual / (priceMonthly * 12)) * 100)
    : 0;

  return (
    <Card
      className={cn(
        "relative flex flex-col transition-all duration-200 hover:shadow-lg",
        isPopular && "border-primary shadow-md ring-1 ring-primary"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
            Most Popular
          </span>
        </div>
      )}

      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        <div className="text-center">
          <span className="text-4xl font-bold">
            {price === 0 ? "Free" : `$${price}`}
          </span>
          {price > 0 && (
            <span className="text-muted-foreground ml-1">{periodLabel}</span>
          )}
          {annualSavings > 0 && billingInterval === "annual" && (
            <p className="mt-1 text-sm text-green-600 dark:text-green-400">
              Save {annualSavings}% with annual billing
            </p>
          )}
        </div>

        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isPopular ? "default" : "outline"}
          size="lg"
          onClick={() => onSelect(billingInterval)}
          disabled={isCurrentPlan || loading}
        >
          {isCurrentPlan ? "Current Plan" : price === 0 ? "Get Started Free" : "Subscribe"}
        </Button>
      </CardFooter>
    </Card>
  );
}
