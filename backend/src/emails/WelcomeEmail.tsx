import {Body, Container, Head, Heading, Html, Link, Preview, Section, Text,} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
    username: string;
}

export const WelcomeEmail = ({username}: WelcomeEmailProps) => {
    return (
        <Html>
            <Head/>
            <Preview>Welcome to Drivio!</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Welcome to Drivio, {username}!</Heading>
                    <Text style={text}>
                        We're excited to have you on board. Your account has been successfully created.
                    </Text>
                    <Section style={buttonContainer}>
                        <Link href="https://drivio.com/dashboard" style={button}>
                            Go to Dashboard
                        </Link>
                    </Section>
                    <Text style={footer}>
                        © 2026 Drivio Inc. All rights reserved.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

// Styles (React Email uses standard JS objects for inline styles)
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    border: '1px solid #e6ebf1',
    borderRadius: '5px',
};

const h1 = {
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '30px 0',
};

const text = {
    color: '#333',
    fontSize: '16px',
    lineHeight: '26px',
    textAlign: 'center' as const,
};

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const button = {
    backgroundColor: '#2563eb',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
    textAlign: 'center' as const,
};