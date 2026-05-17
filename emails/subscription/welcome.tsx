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

interface WelcomeEmailProps {
  freelancerName: string;
  planName: string;
  billingInterval: "monthly" | "annual";
  dashboardUrl: string;
}

export const WelcomeEmail = ({
  freelancerName = "Jane Freelancer",
  planName = "Premium",
  billingInterval = "monthly",
  dashboardUrl = "https://deathear.app/app/dashboard",
}: WelcomeEmailProps) => {
  const previewText = `Welcome to DeathFear ${planName}!`;

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
            <Heading style={h1}>
              Welcome to DeathFear {planName}!
            </Heading>

            <Text style={paragraph}>Hi {freelancerName},</Text>

            <Text style={paragraph}>
              You're officially on the {planName} plan (billed{" "}
              {billingInterval}). Here's what you can do now:
            </Text>

            <Section style={checklistSection}>
              <div style={checklistItem}>
                <span style={checkmark}>✓</span>
                <span>Create unlimited invoices — no limits</span>
              </div>
              <div style={checklistItem}>
                <span style={checkmark}>✓</span>
                <span>Add unlimited clients</span>
              </div>
              <div style={checklistItem}>
                <span style={checkmark}>✓</span>
                <span>Use AI tone adaptation for reminders</span>
              </div>
              <div style={checklistItem}>
                <span style={checkmark}>✓</span>
                <span>Generate legal demand letters</span>
              </div>
              <div style={checklistItem}>
                <span style={checkmark}>✓</span>
                <span>Create small claims filing guides</span>
              </div>
              <div style={checklistItem}>
                <span style={checkmark}>✓</span>
                <span>Priority support</span>
              </div>
            </Section>

            <Text style={paragraph}>
              If you have any tone samples saved, they're now active for AI
              adaptation. Head to Settings to add or manage them.
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={dashboardUrl}>
                Go to Dashboard
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

export default WelcomeEmail;

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

const h1 = {
  color: "#1a1a2e",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 20px",
};

const paragraph = {
  color: "#4a5568",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const checklistSection = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  margin: "24px 0",
  padding: "20px",
};

const checklistItem = {
  color: "#2d3748",
  display: "flex" as const,
  fontSize: "15px",
  gap: "12px",
  lineHeight: "1.5",
  marginBottom: "12px",
};

const checkmark = {
  color: "#48bb78",
  fontWeight: "700",
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
