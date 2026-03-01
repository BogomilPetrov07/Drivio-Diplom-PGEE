import Mailjet from 'node-mailjet';
import { render } from '@react-email/render';
import { WelcomeEmail } from '../emails/WelcomeEmail.js';
import { env } from '../config/env.js';
import React from 'react';

// Initialize Mailjet with your API Keys
const mailjet = new Mailjet.Client({
    apiKey: env.MJ_APIKEY_PUBLIC,
    apiSecret: env.MJ_APIKEY_PRIVATE
});

export const sendWelcomeEmailReact = async (to: string, username: string) => {
    // 1. Render your React Email component
    const emailHtml = await render(React.createElement(WelcomeEmail, { username }));

    // 2. Send via Mailjet API (Not SMTP)
    return mailjet
        .post("send", { version: 'v3.1' })
        .request({
            AdvanceErrorHandling: true,
            Messages: [
                {
                    From: {
                        Email: "noreply@drivio-bg.com",
                        Name: env.EMAIL_FROM
                    },
                    To: [
                        {
                            Email: to,
                            Name: username
                        }
                    ],
                    Subject: "Welcome to Drivio!",
                    HTMLPart: emailHtml,
                }
            ]
        });
};