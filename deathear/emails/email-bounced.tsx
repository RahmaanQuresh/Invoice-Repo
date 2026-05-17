import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface EmailBouncedProps {
  freelancerName: string;
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  invoiceUrl: string;
}

export const EmailBouncedNotification = ({
  freelancerName = "Jane Freelancer",
  clientName = "Acme Corp",
  clientEmail = "client@example.com",
  invoiceNumber = "DF-2025-0001",
  invoiceUrl = "https://deathear.app/app/invoices/id",
}: EmailBouncedProps) => {
  const previewText = `Reminder email bounced for ${clientName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>DeathFear</Text>
          </Section>

          <Section style={content}>
            <Section style={warningIndicator}>
              <span style={warningIcon}>⚠️</span>
            </Section>

            <Heading style={h1}>Email Bounced</Heading>

            <Text style={paragraph}>Hi {freelancerName},</Text>

            <Text style={paragraph}>
              The reminder for Invoice <strong>{invoiceNumber}</strong> was not
              delivered to <strong>{clientName}</strong> at {clientEmail}.
            </Text>

            <Section style={bounceCard}>
              <Text style={bounceReason}>
                This usually means the email address is invalid or the
                recipient's mail server rejected it.
              </Text>
            </Section>

            <Text style={paragraph}>
              We've paused reminders for this invoice until you update the
              client's email address.
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={invoiceUrl}>
                Update Client Email
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={footerText}>
              Sent via <span style={brandText}>DeathFear</span> — Payment
              Recovery for Freelancers
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default EmailBouncedNotification;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: "20px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e6e9ef",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "600px",
  overflow: "hidden",
};

const header = {
  backgroundColor: "#8B5CF6",
  padding: "20px 40px",
};

const headerText = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0",
  textAlign: "center" as const,
};

const content = {
  padding: "40px",
};

const warningIndicator = {
  margin: "0 auto 24px",
  textAlign: "center" as const,
};

const warningIcon = {
  fontSize: "48px",
};

const h1 = {
  color: "#1a1a2e",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const paragraph = {
  color: "#4a5568",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const bounceCard = {
  backgroundColor: "#fff5f5",
  border: "1px solid #fed7d7",
  borderRadius: "8px",
  margin: "24px 0",
  padding: "16px",
};

const bounceReason = {
  color: "#9b2c2c",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
};

const buttonSection = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#8B5CF6",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 32px",
  textDecoration: "none",
};

const hr = {
  border: "none",
  borderTop: "1px solid #e2e8f0",
  margin: "24px 0",
};

const footerText = {
  color: "#718096",
  fontSize: "14px",
  margin: "0",
  textAlign: "center" as const,
};

const brandText = {
  color: "#8B5CF6",
  fontWeight: "600",
};
