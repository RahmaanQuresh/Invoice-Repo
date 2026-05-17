import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface InvoiceSentEmailProps {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  senderName: string;
  senderCompany?: string;
  invoiceUrl: string;
}

export const InvoiceSentEmail = ({
  clientName = "Valued Client",
  invoiceNumber = "DF-2025-0001",
  amount = "$1,500.00",
  dueDate = "March 15, 2025",
  senderName = "Jane Freelancer",
  senderCompany = "Jane's Design Studio",
  invoiceUrl = "https://deathear.app/invoice/token",
}: InvoiceSentEmailProps) => {
  const previewText = `Invoice ${invoiceNumber} from ${senderName}`;

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
            <Heading style={h1}>Invoice from {senderName}</Heading>

            <Text style={paragraph}>Hi {clientName},</Text>

            <Text style={paragraph}>
              You've received a new invoice from {senderName}
              {senderCompany ? ` (${senderCompany})` : ""}. Please find the
              details below.
            </Text>

            <Section style={invoiceCard}>
              <Row style={invoiceRow}>
                <Column style={invoiceLabel}>Invoice:</Column>
                <Column style={invoiceValue}>{invoiceNumber}</Column>
              </Row>
              <Row style={invoiceRow}>
                <Column style={invoiceLabel}>Amount:</Column>
                <Column style={invoiceValue}>{amount}</Column>
              </Row>
              <Row style={invoiceRow}>
                <Column style={invoiceLabel}>Due Date:</Column>
                <Column style={invoiceValue}>{dueDate}</Column>
              </Row>
            </Section>

            <Section style={buttonSection}>
              <Button style={button} href={invoiceUrl}>
                View Invoice
              </Button>
            </Section>

            <Text style={smallText}>
              Or copy this link into your browser: {invoiceUrl}
            </Text>

            <Text style={paragraph}>
              If you have any questions about this invoice, please reply
              directly to this email.
            </Text>

            <Hr style={hr} />

            <Text style={footerText}>
              Sent via{" "}
              <span style={brandText}>DeathFear</span> — Payment Recovery for
              Freelancers
            </Text>
            <Text style={disclaimerText}>
              We track opens to notify {senderName}. Opens are not shared with
              third parties.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default InvoiceSentEmail;

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

const invoiceCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  margin: "24px 0",
  padding: "20px",
};

const invoiceRow = {
  marginBottom: "8px",
};

const invoiceLabel = {
  color: "#718096",
  fontSize: "14px",
  fontWeight: "600",
  width: "100px",
};

const invoiceValue = {
  color: "#1a1a2e",
  fontSize: "16px",
  fontWeight: "600",
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

const smallText = {
  color: "#a0aec0",
  fontSize: "12px",
  margin: "0 0 24px",
  textAlign: "center" as const,
  wordBreak: "break-all" as const,
};

const hr = {
  border: "none",
  borderTop: "1px solid #e2e8f0",
  margin: "24px 0",
};

const footerText = {
  color: "#718096",
  fontSize: "14px",
  margin: "0 0 4px",
  textAlign: "center" as const,
};

const brandText = {
  color: "#8B5CF6",
  fontWeight: "600",
};

const disclaimerText = {
  color: "#a0aec0",
  fontSize: "12px",
  margin: "0",
  textAlign: "center" as const,
};
