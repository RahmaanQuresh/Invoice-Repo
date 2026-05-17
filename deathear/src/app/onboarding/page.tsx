"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowRight, Loader2, Sparkles, SkipForward } from "lucide-react";

type OnboardingStep = "welcome" | "tone" | "client" | "complete";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [loading, setLoading] = useState(false);

  // Tone sample
  const [toneSample, setToneSample] = useState("");

  // First client
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");

  const handleSkipTone = async () => {
    setLoading(true);
    try {
      await fetch("/api/settings/tone-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalText: "", context: "skip" }),
      });
    } catch {
      // Non-critical, continue
    }
    setLoading(false);
    setStep("client");
  };

  const handleSaveTone = async () => {
    if (toneSample.length < 100) {
      toast.error("Please write at least 100 characters so we can match your voice.");
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/settings/tone-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalText: toneSample, context: "onboarding" }),
      });
      toast.success("Voice sample saved!");
    } catch {
      toast.error("Failed to save voice sample");
    }
    setLoading(false);
    setStep("client");
  };

  const handleSkipClient = () => {
    setStep("complete");
  };

  const handleSaveClient = async () => {
    if (!clientName || !clientEmail) {
      toast.error("Client name and email are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clientName, email: clientEmail, company: clientCompany }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Client added!");
      } else {
        toast.error(data.error?.message || "Failed to add client");
      }
    } catch {
      toast.error("Failed to add client");
    }
    setLoading(false);
    setStep("complete");
  };

  const goToDashboard = () => {
    router.push("/app/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4">
      <Card className="w-full max-w-xl p-8 shadow-xl">
        {step === "welcome" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Welcome to DeathFear</h1>
            <p className="text-muted-foreground">
              Never chase a payment again. DeathFear automates the awkward conversations — 
              from friendly reminders to legal escalation — so you can focus on the work.
            </p>
            <p className="text-sm italic text-muted-foreground">
              Built for freelancers, by freelancers.
            </p>
            <Button size="lg" className="w-full" onClick={() => setStep("tone")}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === "tone" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Your Voice Matters</h2>
            <p className="text-muted-foreground">
              Write a short email or message in the way you typically communicate with clients. 
              This helps our AI match your natural voice when sending reminders.
            </p>

            <div className="space-y-2">
              <textarea
                className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={`Hi [Client Name],\n\nHope you're doing well! Just checking in on invoice #[number] for [amount]. Let me know if you have any questions.\n\nBest,\n[Your Name]`}
                value={toneSample}
                onChange={(e) => setToneSample(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {toneSample.length} / 100 characters minimum
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleSkipTone}
                disabled={loading}
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveTone}
                disabled={loading || toneSample.length < 100}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save & Continue
              </Button>
            </div>
          </div>
        )}

        {step === "client" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Add Your First Client</h2>
            <p className="text-muted-foreground">
              Add a client to send your first invoice. You can always add more later.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <Input
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="Company name (optional)"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleSkipClient}
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveClient}
                disabled={loading || !clientName || !clientEmail}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Add Client & Finish
              </Button>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold">You&apos;re All Set!</h1>
            <p className="text-muted-foreground">
              Your DeathFear account is ready. Create your first invoice and let us handle the rest.
            </p>
            <Button size="lg" className="w-full" onClick={goToDashboard}>
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
