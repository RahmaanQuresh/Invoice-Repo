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

interface RenewalEmailProps {
  freelancerName: string;
  planName: string;
  amount: string;
  billingInterval: "monthly" | "annual";
  nextBillingDate: string;
  dashboardUrl: string;
}

export const RenewalEmail = ({
  freelancerName = "Jane Freelancer",
  planName = "Premium",
  amount = "$19.00",
  billingInterval = "monthly",
  nextBillingDate = "April 10, 2025",
  dashboardUrl = "https://deathear.app/app/dashboard",
}: RenewalEmailProps) => {
  const previewText = `Your DeathFear subscription has been renewed`;

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
            <Heading style={h1}>Subscription Renewed</Heading>

            <Text style={paragraph}>Hi {freelancerName},</Text>

            <Text style={paragraph}>
              Your DeathFear {planName} plan has been successfully renewed. The
              amount of <strong>{amount}</strong> has been charged.
            </Text>

            <Section style={renewalCard}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tr>
                  <td style={labelCell}>Plan:</td>
                  <td style={valueCell}>{planName}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Amount:</td>
                  <td style={valueCell}>{amount}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Billing:</td>
                  <td style={valueCell}>{billingInterval}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Next Billing:</td>
                  <td style={valueCell}>{nextBillingDate}</td>
                </tr>
              </table>
            </Section>

            <Text style={paragraph}>
              You can view your full billing history and download receipts from
              your settings.
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={`${dashboardUrl}/settings/billing`}>
                View Billing History
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

export default RenewalEmail;

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

const renewalCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  margin: "24px 0",
  padding: "20px",
};

const labelCell = {
  color: "#718096",
  fontSize: "14px",
  fontWeight: "600",
  padding: "4px 16px 4px 0",
  width: "120px",
};

const valueCell = {
  color: "#1a1a2e",
  fontSize: "15px",
  fontWeight: "600",
  padding: "4px 0",
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
