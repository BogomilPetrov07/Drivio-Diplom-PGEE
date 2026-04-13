import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import * as React from 'react';

interface SupportReplyEmailProps {
  name: string;
  reply: string;
  threadId: string;
}

export const SupportReplyEmail = ({ name, reply, threadId }: SupportReplyEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Drivio support replied to your question</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Support replied to your question</Heading>
          <Text style={text}>Hello {name},</Text>
          <Text style={text}>Our team sent you a reply:</Text>
          <Text style={message}>{reply}</Text>
          <Text style={hint}>You can reply directly to this email to continue the conversation.</Text>
          <Text style={ticket}>Ticket: {threadId}</Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '24px',
  border: '1px solid #e6ebf1',
  borderRadius: '8px',
  maxWidth: '620px',
};

const h1 = {
  color: '#111827',
  fontSize: '22px',
  margin: '0 0 14px',
};

const text = {
  color: '#334155',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 10px',
};

const message = {
  color: '#0f172a',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 12px',
  whiteSpace: 'pre-wrap' as const,
};

const hint = {
  color: '#475569',
  fontSize: '13px',
  margin: '0 0 8px',
};

const ticket = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: 0,
};
