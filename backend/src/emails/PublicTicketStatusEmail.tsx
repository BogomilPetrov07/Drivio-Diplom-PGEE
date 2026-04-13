import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import * as React from 'react';

interface PublicTicketStatusEmailProps {
    name: string;
    status: "OPEN" | "CLOSED";
    threadId: string;
}

export const PublicTicketStatusEmail = ({ name, status, threadId }: PublicTicketStatusEmailProps) => {
    const isClosed = status === "CLOSED";

    return (
        <Html>
            <Head />
            <Preview>{isClosed ? "Your support ticket was closed" : "Your support ticket was reopened"}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>{isClosed ? "Ticket closed" : "Ticket reopened"}</Heading>
                    <Text style={text}>Hello {name},</Text>
                    <Text style={text}>
                        {isClosed
                            ? "Your support ticket was marked as closed by Drivio support."
                            : "Your support ticket is now open again and will be reviewed by Drivio support."}
                    </Text>
                    <Text style={text}>Ticket ID: {threadId}</Text>
                    <Text style={footer}>© 2026 Drivio. All rights reserved.</Text>
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
    margin: '0 0 12px',
};

const footer = {
    color: '#94a3b8',
    fontSize: '12px',
    marginTop: '20px',
};
