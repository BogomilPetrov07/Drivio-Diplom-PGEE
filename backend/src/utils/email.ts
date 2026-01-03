import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { WelcomeEmail } from '../emails/WelcomeEmail.js';
import { env } from '../config/env.js';
import React from 'react';

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

export const sendWelcomeEmailReact = async (to: string, username: string) => {
    // 1. Render the React component to an HTML string
    // This handles all the complex inlining for you
    const emailHtml = await render(React.createElement(WelcomeEmail, { username }));

    // 2. Send the email using the generated HTML
    return await transporter.sendMail({
        from: `"${env.EMAIL_FROM}" <${env.SMTP_USER}>`,
        to,
        subject: "Welcome to Drivio!",
        html: emailHtml,
    });
};