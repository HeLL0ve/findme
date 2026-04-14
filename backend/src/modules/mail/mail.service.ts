import { env } from '../../config/env';

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let nodemailer: any = null;

function initNodemailer() {
  if (nodemailer) return;
  try {
    nodemailer = require('nodemailer');
  } catch {
    nodemailer = false;
  }
}

async function sendViaHttpProvider(input: SendMailInput) {
  const endpoint = env.mailApiUrl;
  const apiKey = env.mailApiKey;
  if (!endpoint || !apiKey) return false;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: env.mailFrom,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  return response.ok;
}

async function sendViaGmailProvider(input: SendMailInput) {
  const gmailUser = env.gmailUser;
  const gmailPassword = env.gmailPassword;
  
  if (!gmailUser || !gmailPassword) return false;

  try {
    initNodemailer();
    if (!nodemailer) return false;
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword, // Google App Password (не обычный пароль!)
      },
    });

    const result = await transporter.sendMail({
      from: gmailUser, // Gmail требует использовать сам аккаунт как from
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    return !!result.messageId;
  } catch (error) {
    console.error('[mail] Gmail provider error', error);
    return false;
  }
}

export async function sendMail(input: SendMailInput) {
  try {
    // Try Gmail first if configured
    const sentViaGmail = await sendViaGmailProvider(input);
    if (sentViaGmail) return { ok: true, provider: 'gmail' };

    // Then try HTTP provider
    const sentViaHttp = await sendViaHttpProvider(input);
    if (sentViaHttp) return { ok: true, provider: 'http' };
  } catch (error) {
    console.error('[mail] provider error', error);
  }

  // Local fallback for development if provider is not configured.
  console.log('[mail] fallback output', {
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
  return { ok: false, fallback: true };
}
