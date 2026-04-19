import { Resend } from 'resend';
import { render } from '@react-email/render';
import { WelcomeEmail } from '../emails/WelcomeEmail.js';
import { PublicQuestionConfirmationEmail } from '../emails/PublicQuestionConfirmationEmail.js';
import { PublicQuestionNotificationEmail } from '../emails/PublicQuestionNotificationEmail.js';
import { PublicTicketStatusEmail } from '../emails/PublicTicketStatusEmail.js';
import { SchoolApprovalSetupEmail } from '../emails/SchoolApprovalSetupEmail.js';
import { UserProfileSetupEmail } from '../emails/UserProfileSetupEmail.js';
import { env } from '../config/env.js';
import React from 'react';

let resendClient: Resend | null = null;

function getResendClient() {
    if (resendClient) return resendClient;
    resendClient = new Resend(env.RESEND_API_KEY);
    return resendClient;
}

export const sendWelcomeEmailReact = async (to: string, username: string) => {
    const resend = getResendClient();
    const emailHtml = await render(React.createElement(WelcomeEmail, { username }));

    return await resend.emails.send({
        from: `Drivio <${env.TRANSACTIONAL_EMAIL}>`,
        to: [to],
        subject: 'Welcome to Drivio!',
        html: emailHtml,
    });
};

export const sendSchoolApprovalSetupEmail = async (
    to: string,
    contactName: string,
    schoolName: string,
    setupUrl: string,
) => {
    const resend = getResendClient();
    const html = await render(React.createElement(SchoolApprovalSetupEmail, { contactName, schoolName, setupUrl }));

    return await resend.emails.send({
        from: `Drivio <${env.TRANSACTIONAL_EMAIL}>`,
        to: [to],
        subject: "Your driving school is approved - complete registration",
        html,
    });
};

export const sendUserProfileSetupEmail = async (
    to: string,
    recipientName: string,
    schoolName: string,
    setupUrl: string,
) => {
    const resend = getResendClient();
    const html = await render(
        React.createElement(UserProfileSetupEmail, {
            recipientName,
            schoolName,
            setupUrl,
            expiresInDays: 3,
            maxUses: 5,
        }),
    );

    return await resend.emails.send({
        from: `Drivio <${env.TRANSACTIONAL_EMAIL}>`,
        to: [to],
        subject: "Complete your Drivio profile",
        html,
    });
};

export const sendPublicQuestionToSupport = async (
    name: string,
    email: string,
    question: string,
    threadId: string,
    source: "PUBLIC" | "USER_DASHBOARD",
) => {
    const resend = getResendClient();
    const safeName = name.trim();
    const safeEmail = email.trim().toLowerCase();
    const safeQuestion = question.trim();
    const emailHtml = await render(
        React.createElement(PublicQuestionNotificationEmail, {
            name: safeName,
            email: safeEmail,
            question: safeQuestion,
        }),
    );

    return await resend.emails.send({
        from: `Drivio Support <support@mail.drivio-bg.com>`,
        to: ["support@mail.drivio-bg.com"],
        replyTo: safeEmail,
        subject: `New ${source === "PUBLIC" ? "public" : "dashboard"} question [TICKET:${threadId}]`,
        html: emailHtml,
    });
};

export const sendPublicQuestionConfirmationEmail = async (to: string, name: string, threadId: string) => {
    const resend = getResendClient();
    const safeName = name.trim();
    const safeTo = to.trim().toLowerCase();
    const emailHtml = await render(React.createElement(PublicQuestionConfirmationEmail, { name: safeName }));

    return await resend.emails.send({
        from: `Drivio No Reply <noreply@mail.drivio-bg.com>`,
        to: [safeTo],
        subject: `Ticket accepted [TICKET:${threadId}]`,
        html: emailHtml,
    });
};

export const sendPublicTicketStatusEmail = async (
    to: string,
    name: string,
    threadId: string,
    status: "OPEN" | "CLOSED",
) => {
    const resend = getResendClient();
    const safeName = name.trim();
    const safeTo = to.trim().toLowerCase();
    const emailHtml = await render(React.createElement(PublicTicketStatusEmail, { name: safeName, status, threadId }));

    return await resend.emails.send({
        from: `Drivio No Reply <noreply@mail.drivio-bg.com>`,
        to: [safeTo],
        subject: status === "CLOSED" ? `Ticket closed [TICKET:${threadId}]` : `Ticket reopened [TICKET:${threadId}]`,
        html: emailHtml,
    });
};
