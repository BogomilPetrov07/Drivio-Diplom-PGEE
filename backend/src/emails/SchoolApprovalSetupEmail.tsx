import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import * as React from "react";

interface SchoolApprovalSetupEmailProps {
  contactName: string;
  schoolName: string;
  setupUrl: string;
}

export function SchoolApprovalSetupEmail({ contactName, schoolName, setupUrl }: SchoolApprovalSetupEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your driving school is approved. Finish setup in 3 steps.</Preview>
      <Body style={main}>
        <Container style={card}>
          <Text style={eyebrow}>Drivio School Onboarding</Text>
          <Heading style={title}>Your School Was Approved</Heading>
          <Text style={paragraph}>Hi {contactName},</Text>
          <Text style={paragraph}>
            Great news. <strong>{schoolName}</strong> has been approved to join Drivio.
          </Text>
          <Text style={paragraph}>
            Complete registration in 3 quick steps: verify school details, create your personal admin account, and review everything before final confirmation.
          </Text>

          <Section style={ctaWrap}>
            <Button style={ctaButton} href={setupUrl}>
              Start Registration
            </Button>
          </Section>

          <Text style={hint}>
            This secure link expires in <strong>3 days</strong> and can be used up to <strong>5 times</strong> while valid.
          </Text>
          <Text style={hint}>If your internet drops or setup is interrupted, open the same link to continue.</Text>
          <Text style={footer}>Drivio Platform Team</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f2f5fb",
  fontFamily: "Inter,Segoe UI,Helvetica,Arial,sans-serif",
  padding: "30px 12px",
};

const card = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #dbe6ff",
  padding: "28px",
  maxWidth: "620px",
};

const eyebrow = {
  color: "#2563eb",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: "0 0 10px",
};

const title = {
  color: "#0f172a",
  fontSize: "30px",
  lineHeight: "1.15",
  margin: "0 0 16px",
};

const paragraph = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const ctaWrap = {
  margin: "26px 0 20px",
};

const ctaButton = {
  backgroundColor: "#2563eb",
  borderRadius: "10px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "700",
  padding: "13px 24px",
  textDecoration: "none",
};

const hint = {
  color: "#475569",
  fontSize: "14px",
  lineHeight: "1.55",
  margin: "0 0 10px",
};

const footer = {
  color: "#64748b",
  fontSize: "13px",
  margin: "18px 0 0",
};
