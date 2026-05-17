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

interface ReminderEmailProps {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  daysOverdue: number;
  senderName: string;
  messageBody: string;
  stepNumber: number;
  totalSteps: number;
  invoiceUrl: string;
  tone: "casual" | "formal" | "informal" | "legal";
}

export const ReminderEmail = ({
  clientName = "Valued Client",
  invoiceNumber = "DF-2025-0001",
  amount = "$1,500.00",
  dueDate = "March 15, 2025",
  daysOverdue = 7,
  senderName = "Jane Freelancer",
  messageBody = "This is a friendly reminder about your outstanding invoice.",
  stepNumber = 1,
  totalSteps = 4,
  invoiceUrl = "https://deathear.app/invoice/token",
  tone = "casual",
}: ReminderEmailProps) => {
  const previewText = `Reminder: Invoice ${invoiceNumber} — ${daysOverdue} days overdue`;
  const toneColors: Record<string, string> = {
    casual: "#48bb78",
    formal: "#3182ce",
    informal: "#ed8936",
    legal: "#e53e3e",
  };
  const progressBarColor = toneColors[tone] || toneColors.casual;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>DeathFear</Text>
            <Text style={headerSubtext}>
              Reminder {stepNumber} of {totalSteps}
            </Text>
          </Section>

          {/* Escalation Progress Bar */}
          <Section style={progressSection}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tr>
                {Array.from({ length: totalSteps }, (_, i) => (
                  <td
                    key={i}
                    style={{
                      ...progressStep,
                      backgroundColor:
                        i < stepNumber ? progressBarColor : "#e2e8f0",
                      borderRadius:
                        i === 0
                          ? "4px 0 0 4px"
                          : i === totalSteps - 1
                            ? "0 4px 4px 0"
                            : "0",
                    }}
                  />
                ))}
              </tr>
            </table>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Payment Reminder</Heading>

            <Text style={paragraph}>Hi {clientName},</Text>

            <Section style={messageBox}>{messageBody}</Section>

            <Section style={invoiceCard}>
              <Text style={cardTitle}>Invoice Summary</Text>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tr>
                  <td style={labelCell}>Invoice:</td>
                  <td style={valueCell}>{invoiceNumber}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Amount:</td>
                  <td style={valueCell}>{amount}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Due Date:</td>
                  <td style={valueCell}>{dueDate}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Overdue:</td>
                  <td style={{ ...valueCell, color: "#e53e3e" }}>
                    {daysOverdue} days
                  </td>
                </tr>
              </table>
            </Section>

            <Section style={buttonSection}>
              <Button style={button} href={invoiceUrl}>
                View Invoice & Pay
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={footerText}>
              Sent via{" "}
              <span style={brandText}>DeathFear</span> on behalf of{" "}
              {senderName}. Replies go directly to {senderName}.
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

export default ReminderEmail;

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

const headerSubtext = {
  color: "rgba(255,255,255,0.8)",
  fontSize: "12px",
  margin: "4px 0 0",
  textAlign: "center" as const,
};

const progressSection = {
  padding: "16px 40px 0",
};

const progressStep = {
  height: "6px",
  transition: "background-color 0.3s ease",
};

const content = {
  padding: "24px 40px 40px",
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

const messageBox = {
  backgroundColor: "#fefcfb",
  border: "1px solid #e2e8f0",
  borderLeft: "4px solid #8B5CF6",
  borderRadius: "4px",
  color: "#2d3748",
  fontSize: "15px",
  fontStyle: "italic" as const,
  lineHeight: "1.7",
  margin: "16px 0",
  padding: "16px 20px",
};

const invoiceCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  margin: "24px 0",
  padding: "20px",
};

const cardTitle = {
  color: "#1a1a2e",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const labelCell = {
  color: "#718096",
  fontSize: "14px",
  fontWeight: "600",
  padding: "4px 12px 4px 0",
  width: "100px",
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
  fontSize: "13px",
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
