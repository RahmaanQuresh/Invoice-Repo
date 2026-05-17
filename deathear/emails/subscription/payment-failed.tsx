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

interface PaymentFailedEmailProps {
  freelancerName: string;
  planName: string;
  amount: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryDate: string;
  billingUrl: string;
}

export const PaymentFailedEmail = ({
  freelancerName = "Jane Freelancer",
  planName = "Premium",
  amount = "$19.00",
  attemptCount = 1,
  maxAttempts = 3,
  nextRetryDate = "March 13, 2025",
  billingUrl = "https://deathear.app/app/settings/billing",
}: PaymentFailedEmailProps) => {
  const isLastAttempt = attemptCount >= maxAttempts;
  const previewText = `Payment failed for your DeathFear subscription`;

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
            <Section style={errorIndicator}>
              <span style={errorIcon}>⚠️</span>
            </Section>

            <Heading style={h1}>Payment Failed</Heading>

            <Text style={paragraph}>Hi {freelancerName},</Text>

            <Text style={paragraph}>
              We were unable to process your {planName} plan payment of{" "}
              <strong>{amount}</strong> (attempt {attemptCount} of{" "}
              {maxAttempts}).
            </Text>

            {!isLastAttempt ? (
              <Section style={retryCard}>
                <Text style={retryText}>
                  We'll automatically retry on{" "}
                  <strong>{nextRetryDate}</strong>.{" "}
                  {maxAttempts - attemptCount > 0
                    ? `${maxAttempts - attemptCount} attempt(s) remaining.`
                    : ""}
                </Text>
                <Text style={retryHint}>
                  To avoid interruption, please update your payment method now.
                </Text>
              </Section>
            ) : (
              <Section style={lastAttemptCard}>
                <Text style={lastAttemptText}>
                  This was the final attempt. Your subscription will be
                  downgraded to the Free plan after the current billing period.
                </Text>
                <Text style={lastAttemptHint}>
                  Update your payment method to keep {planName} features.
                </Text>
              </Section>
            )}

            <Section style={buttonSection}>
              <Button style={button} href={billingUrl}>
                Update Payment Method
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

export default PaymentFailedEmail;

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

const errorIndicator = {
  margin: "0 auto 24px",
  textAlign: "center" as const,
};

const errorIcon = {
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

const retryCard = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: "8px",
  margin: "24px 0",
  padding: "20px",
};

const retryText = {
  color: "#92400e",
  fontSize: "15px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const retryHint = {
  color: "#92400e",
  fontSize: "13px",
  margin: "0",
};

const lastAttemptCard = {
  backgroundColor: "#fff5f5",
  border: "1px solid #fed7d7",
  borderRadius: "8px",
  margin: "24px 0",
  padding: "20px",
};

const lastAttemptText = {
  color: "#9b2c2c",
  fontSize: "15px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const lastAttemptHint = {
  color: "#9b2c2c",
  fontSize: "13px",
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
