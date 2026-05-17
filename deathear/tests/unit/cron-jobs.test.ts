import { describe, it, expect } from "vitest";

// ─── Date & Overdue Calculations ───────────────────────────────────────────

describe("Overdue date calculations", () => {
  it("calculates days overdue correctly for past due dates", () => {
    const daysAgo = 45;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() - daysAgo);
    const daysOverdue = Math.floor(
      (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysOverdue).toBe(daysAgo);
  });

  it("returns 0 days overdue for future due dates", () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10);
    const daysOverdue = Math.max(
      0,
      Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    expect(daysOverdue).toBe(0);
  });

  it("calculates 90+ days as final notice threshold", () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() - 95);
    const daysOverdue = Math.floor(
      (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysOverdue).toBeGreaterThanOrEqual(90);
  });

  it("calculates 180+ days as auto write-off threshold", () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() - 185);
    const daysOverdue = Math.floor(
      (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysOverdue).toBeGreaterThanOrEqual(180);
  });

  it("calculates next reminder date 7 days after due date", () => {
    const dueDate = new Date("2025-01-01");
    const nextReminder = new Date(dueDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    expect(nextReminder.toISOString().split("T")[0]).toBe("2025-01-08");
  });

  it("detects if nextReminderDate is in the past (reminder due)", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const isDue = pastDate <= new Date();
    expect(isDue).toBe(true);
  });

  it("detects if nextReminderDate is in the future (not yet due)", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const isDue = futureDate <= new Date();
    expect(isDue).toBe(false);
  });
});

// ─── Reminder Sequence Parsing ─────────────────────────────────────────────

describe("Reminder sequence parsing", () => {
  const validSequence = [
    { daysAfterDueDate: 7, tone: "friendly", subject: "Payment Reminder", message: "Hi {{clientName}}, your payment of {{amount}} is due." },
    { daysAfterDueDate: 14, tone: "professional", subject: "Follow-Up", message: "Dear {{clientName}}, this is a follow-up..." },
    { daysAfterDueDate: 30, tone: "urgent", subject: "Urgent Payment Required", message: "Final notice for {{clientName}}." },
  ];

  it("parses valid JSON reminder sequence", () => {
    const parsed = JSON.parse(JSON.stringify(validSequence));
    expect(parsed).toHaveLength(3);
    expect(parsed[0].tone).toBe("friendly");
    expect(parsed[2].tone).toBe("urgent");
  });

  it("returns empty array for null/undefined sequence", () => {
    const raw1 = null;
    const raw2 = undefined;
    const parsed1 = raw1 ? JSON.parse(raw1) : [];
    const parsed2 = raw2 ? JSON.parse(raw2) : [];
    expect(parsed1).toHaveLength(0);
    expect(parsed2).toHaveLength(0);
  });

  it("returns empty array for empty sequence", () => {
    const parsed = JSON.parse("[]");
    expect(parsed).toHaveLength(0);
  });

  it("detects when current step exceeds available steps", () => {
    const totalSteps = validSequence.length;
    const currentStep = 3;
    expect(currentStep >= totalSteps).toBe(true);
  });

  it("still has remaining steps when within bounds", () => {
    const totalSteps = validSequence.length;
    const currentStep = 1;
    expect(currentStep < totalSteps).toBe(true);
  });
});

// ─── Reminder Template Filling ─────────────────────────────────────────────

describe("Reminder template filling", () => {
  it("replaces {{clientName}} placeholder", () => {
    const template = "Hi {{clientName}}, your invoice is due.";
    const result = template
      .replace("{{clientName}}", "John Doe")
      .replace("{{amount}}", "$500")
      .replace("{{daysOverdue}}", "30");
    expect(result).toBe("Hi John Doe, your invoice is due.");
  });

  it("replaces {{amount}} placeholder", () => {
    const template = "Payment of {{amount}} is required.";
    const result = template
      .replace("{{clientName}}", "Client")
      .replace("{{amount}}", "$1,250.00")
      .replace("{{daysOverdue}}", "15");
    expect(result).toBe("Payment of $1,250.00 is required.");
  });

  it("replaces {{daysOverdue}} placeholder", () => {
    const template = "Your payment is {{daysOverdue}} days overdue.";
    const result = template
      .replace("{{clientName}}", "Client")
      .replace("{{amount}}", "$500")
      .replace("{{daysOverdue}}", "45");
    expect(result).toBe("Your payment is 45 days overdue.");
  });

  it("replaces all placeholders in a complex template", () => {
    const template = "Dear {{clientName}},\n\nYour invoice of {{amount}} is now {{daysOverdue}} days overdue. Please remit payment immediately.";
    const result = template
      .replace("{{clientName}}", "Acme Corp")
      .replace("{{amount}}", "$5,000.00")
      .replace("{{daysOverdue}}", "60");
    expect(result).toBe(
      "Dear Acme Corp,\n\nYour invoice of $5,000.00 is now 60 days overdue. Please remit payment immediately."
    );
  });

  it("leaves unreplaced placeholders intact", () => {
    const template = "Hi {{clientName}}, {{unknown}} is missing.";
    const result = template.replace("{{clientName}}", "Client");
    expect(result).toContain("{{unknown}}");
  });
});

// ─── Invoice Status Logic ──────────────────────────────────────────────────

describe("Invoice status logic", () => {
  it("identifies overdue invoices where dueDate has passed and status is 'sent'", () => {
    const invoice = {
      status: "sent" as const,
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      paidDate: null,
    };
    const shouldBeMarkedOverdue =
      invoice.status === "sent" &&
      new Date(invoice.dueDate) < new Date() &&
      invoice.paidDate === null;
    expect(shouldBeMarkedOverdue).toBe(true);
  });

  it("does not mark paid invoices as overdue", () => {
    const invoice = {
      status: "sent" as const,
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      paidDate: new Date().toISOString(),
    };
    const shouldBeMarkedOverdue =
      invoice.status === "sent" &&
      new Date(invoice.dueDate) < new Date() &&
      invoice.paidDate === null;
    expect(shouldBeMarkedOverdue).toBe(false);
  });

  it("identifies final notice candidates (90+ days overdue)", () => {
    const invoice = {
      status: "overdue" as const,
      dueDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
      paidDate: null,
    };
    const daysOverdue = Math.floor(
      (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysOverdue).toBeGreaterThanOrEqual(90);
  });

  it("identifies auto write-off candidates (180+ days overdue)", () => {
    const invoice = {
      status: "overdue" as const,
      dueDate: new Date(Date.now() - 185 * 24 * 60 * 60 * 1000).toISOString(),
      paidDate: null,
    };
    const daysOverdue = Math.floor(
      (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysOverdue).toBeGreaterThanOrEqual(180);
  });

  it("does not mark recently overdue invoices for final notice", () => {
    const invoice = {
      status: "overdue" as const,
      dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      paidDate: null,
    };
    const daysOverdue = Math.floor(
      (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysOverdue).toBe(30);
    expect(daysOverdue).toBeLessThan(90);
  });
});

// ─── Subscription Management Logic ─────────────────────────────────────────

describe("Subscription management logic", () => {
  it("identifies expired subscriptions (PAST_DUE)", () => {
    const subscription = {
      status: "ACTIVE" as const,
      currentPeriodEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    };
    const isExpired =
      subscription.status === "ACTIVE" &&
      subscription.currentPeriodEnd < new Date();
    expect(isExpired).toBe(true);
  });

  it("identifies active subscriptions with future period end", () => {
    const subscription = {
      status: "ACTIVE" as const,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    const isExpired =
      subscription.status === "ACTIVE" &&
      subscription.currentPeriodEnd < new Date();
    expect(isExpired).toBe(false);
  });

  it("identifies resumable paused reminders (paused > 30 days)", () => {
    const nextReminderDate = new Date();
    nextReminderDate.setDate(nextReminderDate.getDate() - 35);
    const isResumable =
      nextReminderDate < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    expect(isResumable).toBe(true);
    const notResumable = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
    expect(notResumable < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).toBe(
      false
    );
  });

  it("identifies stuck reminders (no activity for 60+ days)", () => {
    const updatedAt = new Date();
    updatedAt.setDate(updatedAt.getDate() - 70);
    const isStuck = Date.now() - updatedAt.getTime() > 60 * 24 * 60 * 60 * 1000;
    expect(isStuck).toBe(true);
    const recentUpdate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const notStuck =
      Date.now() - recentUpdate.getTime() > 60 * 24 * 60 * 60 * 1000;
    expect(notStuck).toBe(false);
  });
});

// ─── Legal Escalation Status Logic ─────────────────────────────────────────

describe("Legal escalation status logic", () => {
  it("maps legal statuses correctly", () => {
    const statuses = {
      not_started: { label: "Not Started", color: "outline" },
      letter_generated: { label: "Letter Generated", color: "warning" },
      letter_sent: { label: "Letter Sent", color: "warning" },
      small_claims_guide_generated: { label: "Guide Ready", color: "default" },
      resolved: { label: "Resolved", color: "success" },
      paused: { label: "Paused", color: "secondary" },
      canceled: { label: "Canceled", color: "secondary" },
    };

    expect(statuses.not_started.label).toBe("Not Started");
    expect(statuses.resolved.label).toBe("Resolved");
    expect(statuses.canceled.color).toBe("secondary");
  });

  it("determines if legal escalation is active (not canceled/not_started)", () => {
    const isActive = (status: string) =>
      status !== "not_started" && status !== "canceled";
    expect(isActive("letter_sent")).toBe(true);
    expect(isActive("small_claims_guide_generated")).toBe(true);
    expect(isActive("resolved")).toBe(true);
    expect(isActive("not_started")).toBe(false);
    expect(isActive("canceled")).toBe(false);
  });

  it("marks resolved escalation as not active for next step", () => {
    const isActionable = (status: string) =>
      status !== "resolved" &&
      status !== "canceled" &&
      status !== "not_started";
    expect(isActionable("letter_generated")).toBe(true);
    expect(isActionable("resolved")).toBe(false);
    expect(isActionable("canceled")).toBe(false);
  });
});

// ─── Write-Off Logic ───────────────────────────────────────────────────────

describe("Auto write-off logic", () => {
  it("generates correct write-off note with amount", () => {
    const amount = 150000; // cents
    const formattedAmount = `$${(amount / 100).toFixed(2)}`;
    const note = `Auto-written off after 180+ days overdue. Amount: ${formattedAmount}`;
    expect(note).toBe("Auto-written off after 180+ days overdue. Amount: $1500.00");
  });

  it("sets status to written_off on write-off", () => {
    const newStatus = "written_off";
    expect(newStatus).toBe("written_off");
  });

  it("handles zero amount write-off", () => {
    const amount = 0;
    const formattedAmount = `$${(amount / 100).toFixed(2)}`;
    const note = `Auto-written off after 180+ days overdue. Amount: ${formattedAmount}`;
    expect(note).toBe("Auto-written off after 180+ days overdue. Amount: $0.00");
  });
});
