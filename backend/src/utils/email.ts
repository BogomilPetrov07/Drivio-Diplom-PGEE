import { Resend } from 'resend';
import { render } from '@react-email/render';
import { WelcomeEmail } from '../emails/WelcomeEmail.js';
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
