import * as bcrypt from 'bcrypt';
import { env } from '../../../config/env';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../shared/errors/apiError';
import { createRawToken, hashToken } from '../../../shared/security/tokenHash';
import { buildEmailVerificationMail, buildPasswordResetMail } from '../../mail/mail.templates';
import { sendMail } from '../../mail/mail.service';
import { createAuthSession } from './login.service';

const EMAIL_VERIFY_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_MINUTES = 30;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildClientLink(path: string) {
  return `${env.appUrl.replace(/\/+$/, '')}${path}`;
}

function buildMailBrandConfig() {
  return {
    brandName: env.mailBrandName,
    logoUrl: env.mailLogoUrl,
  };
}

function createVerificationCode() {
  return Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
}

function buildVerificationHash(userId: string, code: string) {
  return hashToken(`${userId}:${code}`);
}

async function sendVerificationEmail(email: string, code: string) {
  const verifyUrl = `${buildClientLink('/verify-email')}?email=${encodeURIComponent(email)}`;
  const supportEmail = env.mailFrom.includes('@') ? env.mailFrom : '';
  const mail = buildEmailVerificationMail({
    actionUrl: verifyUrl,
    code,
    brand: buildMailBrandConfig(),
    ...(supportEmail ? { supportEmail } : {}),
  });

  await sendMail({
    to: email,
    subject: mail.subjectTitle,
    text: mail.text,
    html: mail.html,
  });
}

async function sendPasswordResetEmail(email: string, token: string) {
  const link = buildClientLink('/reset-password') + `?token=${encodeURIComponent(token)}`;
  const supportEmail = env.mailFrom.includes('@') ? env.mailFrom : '';
  const mail = buildPasswordResetMail({
    actionUrl: link,
    brand: buildMailBrandConfig(),
    ...(supportEmail ? { supportEmail } : {}),
  });

  await sendMail({
    to: email,
    subject: mail.subjectTitle,
    text: mail.text,
    html: mail.html,
  });
}

export async function issueEmailVerificationToken(userId: string, email: string) {
  const code = createVerificationCode();
  const tokenHash = buildVerificationHash(userId, code);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_HOURS * 60 * 60 * 1000);

  await prisma.emailVerificationToken.deleteMany({
    where: { userId },
  });

  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  await sendVerificationEmail(email, code);
}

export async function resendEmailVerification(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: true };
  if (user.emailVerifiedAt) return { ok: true, alreadyVerified: true };

  await issueEmailVerificationToken(user.id, user.email);
  return { ok: true };
}

export async function verifyEmailByToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const token = await prisma.emailVerificationToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
    include: { user: true },
  });

  if (!token) {
    throw new ApiError('INVALID_OR_EXPIRED_TOKEN', 'Ссылка подтверждения недействительна или устарела', 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: {
        ...(token.user.emailVerifiedAt ? {} : { emailVerifiedAt: now }),
      },
    }),
    prisma.emailVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: now },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: token.userId, usedAt: null, id: { not: token.id } },
    }),
  ]);

  return createAuthSession({
    id: token.user.id,
    email: token.user.email,
    role: token.user.role,
    name: token.user.name,
    avatarUrl: token.user.avatarUrl,
  });
}

export async function verifyEmailByCode(emailInput: string, code: string) {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError('INVALID_OR_EXPIRED_CODE', 'Код подтверждения недействителен или устарел', 400);
  }

  const tokenHash = buildVerificationHash(user.id, code);
  const now = new Date();

  const token = await prisma.emailVerificationToken.findFirst({
    where: {
      userId: user.id,
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
    include: { user: true },
  });

  if (!token) {
    throw new ApiError('INVALID_OR_EXPIRED_CODE', 'Код подтверждения недействителен или устарел', 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: {
        ...(token.user.emailVerifiedAt ? {} : { emailVerifiedAt: now }),
      },
    }),
    prisma.emailVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: now },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: token.userId, usedAt: null, id: { not: token.id } },
    }),
  ]);

  return createAuthSession({
    id: token.user.id,
    email: token.user.email,
    role: token.user.role,
    name: token.user.name,
    avatarUrl: token.user.avatarUrl,
  });
}

export async function issuePasswordReset(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: true };

  const token = createRawToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  await sendPasswordResetEmail(user.email, token);
  return { ok: true };
}

export async function resetPasswordByToken(rawToken: string, newPassword: string) {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const token = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
  });

  if (!token) {
    throw new ApiError('INVALID_OR_EXPIRED_TOKEN', 'Ссылка сброса пароля недействительна или устарела', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: now },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: token.userId, usedAt: null, id: { not: token.id } },
    }),
  ]);

  return { ok: true };
}
