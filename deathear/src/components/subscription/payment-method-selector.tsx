"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CreditCard, Building2, Smartphone } from "lucide-react";

export type PaymentMethod = "stripe" | "paypal" | "razorpay";

interface PaymentMethodSelectorProps {
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
}

const methods: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "stripe",
    label: "Credit Card",
    description: "Pay with Visa, Mastercard, or American Express",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "Pay with your PayPal account",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: "razorpay",
    label: "UPI AutoPay",
    description: "Pay with UPI (Google Pay, PhonePe, Paytm)",
    icon: <Smartphone className="h-5 w-5" />,
  },
];

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="grid gap-3">
      {methods.map((method) => (
        <button
          key={method.id}
          type="button"
          onClick={() => onChange(method.id)}
          className={cn(
            "flex items-center gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary/50 hover:bg-accent",
            value === method.id && "border-primary bg-primary/5 ring-1 ring-primary"
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              value === method.id ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            {method.icon}
          </div>
          <div className="flex-1">
            <div className="font-medium">{method.label}</div>
            <div className="text-sm text-muted-foreground">{method.description}</div>
          </div>
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border-2",
              value === method.id ? "border-primary bg-primary" : "border-muted-foreground"
            )}
          >
            {value === method.id && (
              <div className="h-2 w-2 rounded-full bg-white" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
