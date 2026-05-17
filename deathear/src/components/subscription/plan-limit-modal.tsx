"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowUpRight, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlanLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: "invoices" | "clients";
  currentCount: number;
  maxCount: number;
}

export function PlanLimitModal({
  open,
  onOpenChange,
  limitType,
  currentCount,
  maxCount,
}: PlanLimitModalProps) {
  const router = useRouter();

  const title =
    limitType === "invoices"
      ? "Invoice Limit Reached"
      : "Client Limit Reached";

  const description =
    limitType === "invoices"
      ? `You've used ${currentCount} of ${maxCount} invoices this month. Upgrade to Premium for unlimited invoices.`
      : `You've added ${currentCount} of ${maxCount} clients. Upgrade to Premium for unlimited clients.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg bg-muted p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Free Plan</span>
            <span className="font-medium">
              {currentCount}/{maxCount} {limitType}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Premium Plan</span>
            <span className="font-medium text-primary">Unlimited</span>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full gap-2"
            onClick={() => {
              onOpenChange(false);
              router.push("/app/subscribe");
            }}
          >
            Upgrade to Premium
            <ArrowUpRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
