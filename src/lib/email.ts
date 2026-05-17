import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

export async function sendEmail({
  to,
  subject,
  html,
  from = "DeathFear <reminders@deathear.app>",
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}) {
  // Skip sending if no API key configured
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Email would be sent: To=${to}, Subject=${subject}`);
    return { id: "dev-mode", from, to: [to], subject };
  }

  const response = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
    replyTo,
    tags: [{ name: "category", value: "reminder" }],
  });

  return response;
}

export async function sendReminderEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  return sendEmail({
    to,
    subject,
    html,
    from: "DeathFear <reminders@deathear.app>",
    replyTo,
  });
}
