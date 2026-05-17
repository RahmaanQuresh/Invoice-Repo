"use client";

import { useState } from "react";
import { Loader2, Sparkles, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type AITone = "friendly" | "professional" | "urgent";

interface AIPreviewProps {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  daysOverdue: number;
  amount: number;
  onApply: (content: { subject: string; message: string; tone: AITone }) => void;
  onClose: () => void;
}

export function AIPreview({
  invoiceId,
  invoiceNumber,
  clientName,
  daysOverdue,
  amount,
  onApply,
  onClose,
}: AIPreviewProps) {
  const [tone, setTone] = useState<AITone>("professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{
    subject: string;
    message: string;
    tone: AITone;
  } | null>(null);

  const generateReminder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reminders/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          invoiceNumber,
          clientName,
          daysOverdue,
          amount,
          tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to generate");
      setGenerated(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg">AI Reminder Generator</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Generate a personalized reminder for {clientName} about Invoice{" "}
          {invoiceNumber}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {(["friendly", "professional", "urgent"] as const).map((t) => (
            <Button
              key={t}
              variant={tone === t ? "default" : "outline"}
              size="sm"
              onClick={() => setTone(t)}
              className="capitalize"
            >
              {t === "friendly" && "😊 "}
              {t === "professional" && "👔 "}
              {t === "urgent" && "🔴 "}
              {t}
            </Button>
          ))}
        </div>

        {!generated && !loading && (
          <Button
            onClick={generateReminder}
            className="w-full"
            variant="secondary"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Reminder
          </Button>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Crafting your reminder...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {generated && (
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                SUBJECT
              </label>
              <p className="mt-1 text-sm font-medium">{generated.subject}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                MESSAGE
              </label>
              <div className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {generated.message}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {generated && (
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={generateReminder}
            disabled={loading}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
          <Button onClick={() => onApply(generated)} className="flex-1">
            <Check className="mr-2 h-4 w-4" />
            Apply Reminder
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
