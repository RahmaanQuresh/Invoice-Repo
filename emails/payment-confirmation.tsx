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

interface PaymentConfirmationProps {
  freelancerName: string;
  clientName: string;
  invoiceNumber: string;
  amountPaid: string;
  totalAmount: string;
  remainingBalance?: string;
  paymentDate: string;
  invoiceUrl: string;
}

export const PaymentConfirmationEmail = ({
  freelancerName = "Jane Freelancer",
  clientName = "Acme Corp",
  invoiceNumber = "DF-2025-0001",
  amountPaid = "$1,500.00",
  totalAmount = "$1,500.00",
  remainingBalance,
  paymentDate = "March 10, 2025",
  invoiceUrl = "https://deathear.app/app/invoices/id",
}: PaymentConfirmationProps) => {
  const isPartial = Boolean(remainingBalance);
  const previewText = isPartial
    ? `Partial payment received — Invoice ${invoiceNumber}`
    : `Payment received — Invoice ${invoiceNumber}`;

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
            {/* Success Indicator */}
            <Section style={successIndicator}>
              <div style={checkCircle}>✓</div>
            </Section>

            <Heading style={h1}>
              {isPartial ? "Partial Payment Received" : "Payment Received!"}
            </Heading>

            <Text style={paragraph}>Hi {freelancerName},</Text>

            <Text style={paragraph}>
              Great news! {clientName} has paid{" "}
              {isPartial ? `${amountPaid} of ${totalAmount}` : amountPaid} for
              Invoice {invoiceNumber} on {paymentDate}.
            </Text>

            {isPartial && remainingBalance && (
              <Section style={partialNote}>
                <Text style={partialNoteText}>
                  Remaining balance: <strong>{remainingBalance}</strong>
                </Text>
                <Text style={partialNoteSubtext}>
                  Reminders have been paused for 14 days to allow for the
                  remaining payment. You can resume them manually at any time.
                </Text>
              </Section>
            )}

            <Section style={buttonSection}>
              <Button style={button} href={invoiceUrl}>
                View Invoice
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

export default PaymentConfirmationEmail;

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

const successIndicator = {
  margin: "0 auto 24px",
  textAlign: "center" as const,
};

const checkCircle = {
  backgroundColor: "#48bb78",
  borderRadius: "50%",
  color: "#ffffff",
  display: "inline-flex",
  fontSize: "28px",
  fontWeight: "700",
  height: "64px",
  width: "64px",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  lineHeight: "64px",
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

const partialNote = {
  backgroundColor: "#fffff0",
  border: "1px solid #f6e05e",
  borderRadius: "8px",
  margin: "24px 0",
  padding: "16px",
};

const partialNoteText = {
  color: "#744210",
  fontSize: "15px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const partialNoteSubtext = {
  color: "#975a16",
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
