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

interface TrialEndingEmailProps {
  freelancerName: string;
  planName: string;
  daysRemaining: number;
  endDate: string;
  subscribeUrl: string;
}

export const TrialEndingEmail = ({
  freelancerName = "Jane Freelancer",
  planName = "Premium",
  daysRemaining = 3,
  endDate = "March 13, 2025",
  subscribeUrl = "https://deathear.app/app/subscribe",
}: TrialEndingEmailProps) => {
  const previewText = `Your DeathFear ${planName} trial ends in ${daysRemaining} days`;

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
            <Section style={timerIndicator}>
              <span style={timerIcon}>⏰</span>
            </Section>

            <Heading style={h1}>Trial Ending Soon</Heading>

            <Text style={paragraph}>Hi {freelancerName},</Text>

            <Text style={paragraph}>
              Your {planName} trial ends in <strong>{daysRemaining} days</strong>{" "}
              (on {endDate}).
            </Text>

            <Section style={benefitsCard}>
              <Text style={benefitsTitle}>Keep your Premium features:</Text>
              <div style={benefitItem}>
                <span style={checkmark}>✓</span>
                <span>Unlimited invoices & clients</span>
              </div>
              <div style={benefitItem}>
                <span style={checkmark}>✓</span>
                <span>AI tone adaptation</span>
              </div>
              <div style={benefitItem}>
                <span style={checkmark}>✓</span>
                <span>Legal escalation tools</span>
              </div>
            </Section>

            <Text style={paragraph}>
              If you don't upgrade, your account will switch to the Free plan,
              which includes 3 invoices/month and 5 clients — all your data
              stays safe.
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={subscribeUrl}>
                Upgrade to {planName}
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

export default TrialEndingEmail;

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

const timerIndicator = {
  margin: "0 auto 24px",
  textAlign: "center" as const,
};

const timerIcon = {
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

const benefitsCard = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  margin: "24px 0",
  padding: "20px",
};

const benefitsTitle = {
  color: "#1a1a2e",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 12px",
};

const benefitItem = {
  color: "#4a5568",
  display: "flex" as const,
  fontSize: "14px",
  gap: "8px",
  lineHeight: "1.5",
  marginBottom: "8px",
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
