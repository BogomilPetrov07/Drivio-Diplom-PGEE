import { Resend } from 'resend';
import { render } from '@react-email/render';
import { WelcomeEmail } from '../emails/WelcomeEmail.js';
import { PublicQuestionConfirmationEmail } from '../emails/PublicQuestionConfirmationEmail.js';
import { PublicQuestionNotificationEmail } from '../emails/PublicQuestionNotificationEmail.js';
import { PublicTicketStatusEmail } from '../emails/PublicTicketStatusEmail.js';
import { env } from '../config/env.js';
import React from 'react';

const resend = new Resend(env.RESEND_API_KEY);

export const sendWelcomeEmailReact = async (to: string, username: string) => {
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
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#111827">
        <h2 style="margin:0 0 12px">Your Drivio Join Request Was Approved</h2>
        <p>Hello ${contactName},</p>
        <p>Your request for <strong>${schoolName}</strong> was approved by Drivio superadmin.</p>
        <p>Complete your administrator setup by opening the link below:</p>
        <p><a href="${setupUrl}" style="color:#2563eb;font-weight:600">${setupUrl}</a></p>
        <p>This link expires in 48 hours.</p>
      </div>
    `;

    return await resend.emails.send({
        from: `Drivio <${env.TRANSACTIONAL_EMAIL}>`,
        to: [to],
        subject: "Complete your Drivio school admin setup",
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
