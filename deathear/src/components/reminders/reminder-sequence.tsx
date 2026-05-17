"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  PauseCircle,
  PlayCircle,
  Loader2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AIPreview } from "./ai-preview";
import type { ReminderStep } from "@/types/invoice";

interface ReminderSequenceProps {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  daysOverdue: number;
  amount: number;
  reminderEnabled: boolean;
  reminderPaused: boolean;
  currentStep: number;
  sequence: ReminderStep[];
  nextReminderDate?: string | null;
  onUpdate: (updates: {
    reminderEnabled?: boolean;
    reminderPaused?: boolean;
    reminderSequence?: ReminderStep[];
  }) => Promise<void>;
}

const toneColors: Record<string, string> = {
  friendly: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  professional:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export function ReminderSequence({
  invoiceId,
  invoiceNumber,
  clientName,
  daysOverdue,
  amount,
  reminderEnabled,
  reminderPaused,
  currentStep,
  sequence,
  nextReminderDate,
  onUpdate,
}: ReminderSequenceProps) {
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const toggleEnabled = async () => {
    setLoading("toggle");
    try {
      await onUpdate({ reminderEnabled: !reminderEnabled });
    } finally {
      setLoading(null);
    }
  };

  const togglePause = async () => {
    setLoading("pause");
    try {
      await onUpdate({ reminderPaused: !reminderPaused });
    } finally {
      setLoading(null);
    }
  };

  const handleAIPreviewApply = async (content: {
    subject: string;
    message: string;
    tone: "friendly" | "professional" | "urgent";
  }) => {
    const updatedSequence = [...sequence];
    if (updatedSequence.length === 0) {
      updatedSequence.push({
        daysAfterDueDate: 0,
        tone: content.tone,
        subject: content.subject,
        message: content.message,
      });
    } else {
      // Update the current step or add a new one
      const currentIndex = Math.min(currentStep, updatedSequence.length - 1);
      if (currentIndex >= 0) {
        updatedSequence[currentIndex] = {
          ...updatedSequence[currentIndex],
          tone: content.tone,
          subject: content.subject,
          message: content.message,
        };
      } else {
        updatedSequence.push({
          daysAfterDueDate: 0,
          tone: content.tone,
          subject: content.subject,
          message: content.message,
        });
      }
    }

    setLoading("apply-ai");
    try {
      await onUpdate({ reminderSequence: updatedSequence });
      setShowAIPreview(false);
    } finally {
      setLoading(null);
    }
  };

  if (sequence.length === 0 && !reminderEnabled) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Reminders</CardTitle>
            </div>
          </div>
          <CardDescription>
            No reminder sequence configured for this invoice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setShowAIPreview(true)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Reminder Sequence with AI
          </Button>
        </CardContent>
        {showAIPreview && (
          <CardFooter className="flex-col">
            <AIPreview
              invoiceId={invoiceId}
              invoiceNumber={invoiceNumber}
              clientName={clientName}
              daysOverdue={daysOverdue}
              amount={amount}
              onApply={handleAIPreviewApply}
              onClose={() => setShowAIPreview(false)}
            />
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Reminders</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIPreview(!showAIPreview)}
            >
              <Sparkles className="mr-1 h-3 w-3" />
              AI
            </Button>
            <Switch
              checked={reminderEnabled}
              onCheckedChange={toggleEnabled}
              disabled={loading === "toggle"}
            />
            {reminderEnabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePause}
                disabled={loading === "pause"}
              >
                {loading === "pause" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : reminderPaused ? (
                  <PlayCircle className="h-4 w-4" />
                ) : (
                  <PauseCircle className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        {reminderEnabled && !reminderPaused && nextReminderDate && (
          <CardDescription>
            Next reminder scheduled for{" "}
            {new Date(nextReminderDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        )}
        {reminderPaused && (
          <CardDescription className="text-amber-600 dark:text-amber-400">
            <PauseCircle className="mr-1 inline h-3 w-3" />
            Reminders are paused
          </CardDescription>
        )}
        {!reminderEnabled && (
          <CardDescription>Reminders are disabled</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sequence.map((step, index) => {
            const isComplete = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={index}
                className={`relative flex gap-3 rounded-lg border p-3 transition-colors ${
                  isCurrent
                    ? "border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-950"
                    : isComplete
                      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                      : ""
                }`}
              >
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isComplete
                        ? "bg-green-500 text-white"
                        : isCurrent
                          ? "bg-purple-500 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  {index < sequence.length - 1 && (
                    <div
                      className={`mt-1 h-full w-0.5 ${
                        isComplete
                          ? "bg-green-300 dark:bg-green-700"
                          : "bg-muted"
                      }`}
                    />
                  )}
                </div>

                {/* Step content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Step {index + 1}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          toneColors[step.tone] || ""
                        }`}
                      >
                        {step.tone}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {step.daysAfterDueDate > 0
                        ? `+${step.daysAfterDueDate} days after due`
                        : "Due date"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {step.subject}
                  </p>
                  {isCurrent && daysOverdue > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <Clock className="h-3 w-3" />
                      <span>{daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      {showAIPreview && (
        <CardFooter className="flex-col">
          <AIPreview
            invoiceId={invoiceId}
            invoiceNumber={invoiceNumber}
            clientName={clientName}
            daysOverdue={daysOverdue}
            amount={amount}
            onApply={handleAIPreviewApply}
            onClose={() => setShowAIPreview(false)}
          />
        </CardFooter>
      )}
    </Card>
  );
}
