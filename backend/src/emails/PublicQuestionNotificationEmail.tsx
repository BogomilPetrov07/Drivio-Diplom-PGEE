import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';

interface PublicQuestionNotificationEmailProps {
    name: string;
    email: string;
    question: string;
}

export const PublicQuestionNotificationEmail = ({ name, email, question }: PublicQuestionNotificationEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>New public question submitted on Drivio website</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>New Public Question</Heading>
                    <Section style={infoBlock}>
                        <Text style={label}>Name</Text>
                        <Text style={value}>{name}</Text>
                        <Text style={label}>Email</Text>
                        <Text style={value}>{email}</Text>
                        <Text style={label}>Question</Text>
                        <Text style={questionText}>{question}</Text>
                    </Section>
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
    margin: '0 0 20px',
};

const infoBlock = {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
};

const label = {
    color: '#475569',
    fontSize: '12px',
    fontWeight: 'bold',
    margin: '0 0 4px',
    textTransform: 'uppercase' as const,
};

const value = {
    color: '#111827',
    fontSize: '14px',
    margin: '0 0 14px',
};

const questionText = {
    color: '#111827',
    fontSize: '14px',
    lineHeight: '22px',
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
};
