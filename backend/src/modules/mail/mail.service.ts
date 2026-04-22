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
        pass: gmailPassword,
      },
    });

    const result = await transporter.sendMail({
      from: `FindMe <${gmailUser}>`,
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
    const sentViaGmail = await sendViaGmailProvider(input);
    if (sentViaGmail) return { ok: true, provider: 'gmail' };

    const sentViaHttp = await sendViaHttpProvider(input);
    if (sentViaHttp) return { ok: true, provider: 'http' };
  } catch (error) {
    console.error('[mail] provider error', error);
  }

  console.log('[mail] fallback output', {
    to: input.to,
    subject: input.subject,
    text: input.text,
  });

  return { ok: false, fallback: true };
}
