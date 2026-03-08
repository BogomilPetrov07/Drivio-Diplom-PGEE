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