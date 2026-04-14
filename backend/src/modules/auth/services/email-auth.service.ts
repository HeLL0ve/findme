import bcrypt from 'bcrypt';
import { prisma } from '../../../config/prisma';
import { env } from '../../../config/env';
import { ApiError } from '../../../shared/errors/apiError';
import { createRawToken, hashToken } from '../../../shared/security/tokenHash';
import { sendMail } from '../../mail/mail.service';

const EMAIL_VERIFY_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_MINUTES = 30;

function buildClientLink(path: string, token: string) {
  const base = env.appUrl.replace(/\/+$/, '');
  return `${base}${path}?token=${encodeURIComponent(token)}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function sendVerificationEmail(email: string, token: string) {
  const link = buildClientLink('/verify-email', token);
  await sendMail({
    to: email,
    subject: 'Подтверждение email в FindMe',
    text: `Подтвердите email: ${link}`,
    html: `<p>Подтвердите email для аккаунта FindMe:</p><p><a href="${link}">${link}</a></p>`,
  });
}

async function sendPasswordResetEmail(email: string, token: string) {
  const link = buildClientLink('/reset-password', token);
  await sendMail({
    to: email,
    subject: 'Сброс пароля в FindMe',
    text: `Ссылка для сброса пароля: ${link}`,
    html: `<p>Сброс пароля для аккаунта FindMe:</p><p><a href="${link}">${link}</a></p>`,
  });
}

export async function issueEmailVerificationToken(userId: string, email: string) {
  const token = createRawToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_HOURS * 60 * 60 * 1000);

  await prisma.emailVerificationToken.deleteMany({
    where: { userId, usedAt: null },
  });

  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  await sendVerificationEmail(email, token);
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

  return { ok: true };
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
