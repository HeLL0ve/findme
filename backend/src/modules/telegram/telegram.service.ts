import { readFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';

import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { createRawToken } from '../../shared/security/tokenHash';
import {
  editTelegramMessageReplyMarkup,
  sendTelegramMediaGroup,
  sendTelegramMessage,
  sendTelegramMessageWithButton,
  sendTelegramPhoto,
} from './telegram.api';
import type { TelegramPhotoInput } from './telegram.api';

type ApprovedAdPayload = {
  id: string;
  type: string;
  status: string;
  petName: string | null;
  animalType: string | null;
  breed: string | null;
  color: string | null;
  description: string;
  location?: { address: string | null; city?: string | null } | null;
  photos?: Array<{ photoUrl: string }>;
};

const TELEGRAM_CAPTION_LIMIT = 1024;
const TELEGRAM_MESSAGE_LIMIT = 4096;
function buildBotStartLink(code: string) {
  if (!env.telegramBotUsername) return '';
  return `https://t.me/${env.telegramBotUsername}?start=link_${code}`;
}

function escapeTelegramHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  if (maxLength <= 3) return '.'.repeat(Math.max(maxLength, 0));
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function getAppBaseUrl() {
  return getBaseUrl(env.appUrl.trim());
}

function getPublicApiBaseUrl() {
  return getHttpBaseUrl(env.publicApiUrl.trim());
}

function getBaseUrl(raw: string) {
  if (!raw) return null;

  try {
    new URL(raw);
    return raw.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function getHttpBaseUrl(raw: string) {
  const baseUrl = getBaseUrl(raw);
  if (!baseUrl) return null;

  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return baseUrl;
  } catch {
    return null;
  }
}

function buildTelegramButton(text: string, url?: string) {
  if (!url || !canUseTelegramExternalUrl(url)) return undefined;

  return {
    inline_keyboard: [
      [
        {
          text,
          url,
        },
      ],
    ],
  };
}

function buildTelegramActionLabel(link: string) {
  if (link.includes('/chats/')) return 'Открыть чат';
  if (link.includes('/ads/')) return 'Открыть объявление';
  return 'Открыть';
}

function isPrivateIpv4(hostname: string) {
  if (net.isIP(hostname) !== 4) return false;

  const parts = hostname.split('.').map(Number);
  const a = parts[0];
  const b = parts[1];
  if (a === undefined || b === undefined) return false;

  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

function canUseTelegramExternalUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '0.0.0.0' || hostname === '::1') return false;
    if (isPrivateIpv4(hostname)) return false;

    return true;
  } catch {
    return false;
  }
}

function buildTelegramLinkPreview(url: string, label: string) {
  if (!url) return '';
  if (canUseTelegramExternalUrl(url)) {
    return `<a href="${escapeTelegramHtml(url)}">${escapeTelegramHtml(label)}</a>`;
  }

  return `Ссылка: ${escapeTelegramHtml(url)}`;
}

function buildAdBody(ad: ApprovedAdPayload, maxLength: number) {
  const title = ad.type === 'LOST' ? '🚨 <b>ПРОПАЛ ПИТОМЕЦ</b>' : '🏡 <b>НАЙДЕН ПИТОМЕЦ</b>';
  const accent = ad.type === 'LOST' ? '⚠️ Если вы видели питомца, откройте объявление и свяжитесь с автором.' : '🤝 Если это ваш питомец, откройте объявление и напишите автору.';
  const tags = ad.type === 'LOST' ? '#findme #потеряшка' : '#findme #найденыш';
  const lines = [
    title,
    ad.petName ? `• <b>Кличка:</b> ${escapeTelegramHtml(ad.petName)}` : '',
    ad.animalType ? `• <b>Вид:</b> ${escapeTelegramHtml(ad.animalType)}` : '',
    ad.breed ? `• <b>Порода:</b> ${escapeTelegramHtml(ad.breed)}` : '',
    ad.color ? `• <b>Окрас:</b> ${escapeTelegramHtml(ad.color)}` : '',
    ad.location?.city ? `• <b>Город:</b> ${escapeTelegramHtml(ad.location.city)}` : '',
    ad.location?.address ? `• <b>Адрес:</b> ${escapeTelegramHtml(ad.location.address)}` : '',
    '',
    accent,
    tags,
  ].filter(Boolean);

  const header = lines.join('\n');
  const descriptionPrefix = '\n\n<b>Описание:</b> ';
  const descriptionLimit = Math.max(0, maxLength - header.length - descriptionPrefix.length);
  const description = truncateText(escapeTelegramHtml(ad.description), descriptionLimit);

  return `${header}${descriptionPrefix}${description}`.trim();
}

function buildApprovedAdMessage(ad: ApprovedAdPayload) {
  return buildAdBody(ad, TELEGRAM_MESSAGE_LIMIT);
}

function buildApprovedAdCaption(ad: ApprovedAdPayload, link?: string) {
  const linkPreview = link ? buildTelegramLinkPreview(link, 'Открыть объявление') : '';
  const linkLine = linkPreview ? `\n\n${linkPreview}` : '';
  const bodyLimit = Math.max(0, TELEGRAM_CAPTION_LIMIT - linkLine.length);
  return `${buildAdBody(ad, bodyLimit)}${linkLine}`;
}

async function resolveTelegramPhotoInputs(ad: ApprovedAdPayload): Promise<TelegramPhotoInput[]> {
  const publicBaseUrl = getPublicApiBaseUrl();
  const inputs: TelegramPhotoInput[] = [];

  for (const photo of ad.photos || []) {
    if (inputs.length >= 10) break;

    if (photo.photoUrl.startsWith('http://') || photo.photoUrl.startsWith('https://')) {
      inputs.push(photo.photoUrl);
      continue;
    }

    if (photo.photoUrl.startsWith('/uploads/')) {
      const localPath = path.resolve(process.cwd(), `.${photo.photoUrl}`);

      try {
        const buffer = await readFile(localPath);
        inputs.push({
          buffer,
          filename: path.basename(localPath),
        });
        continue;
      } catch (error) {
        console.warn('[telegram] failed to read local ad photo', {
          adId: ad.id,
          photoUrl: photo.photoUrl,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (!publicBaseUrl) continue;
    inputs.push(`${publicBaseUrl}${photo.photoUrl}`);
  }

  return inputs;
}

export async function createTelegramLinkToken(userId: string) {
  const code = createRawToken(12);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.telegramLinkToken.deleteMany({
    where: { userId, usedAt: null },
  });

  await prisma.telegramLinkToken.create({
    data: { userId, code, expiresAt },
  });

  return {
    code,
    expiresAt,
    link: buildBotStartLink(code),
  };
}

export async function getTelegramLinkStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      telegramChatId: true,
      telegramUsername: true,
      telegramLinkedAt: true,
    },
  });

  if (!user) return { linked: false };

  return {
    linked: Boolean(user.telegramChatId),
    telegramUsername: user.telegramUsername ?? null,
    telegramLinkedAt: user.telegramLinkedAt ?? null,
  };
}

export async function unlinkTelegram(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramChatId: null,
      telegramUserId: null,
      telegramLinkedAt: null,
    },
  });
}

export async function processTelegramStart(
  payload: string | undefined,
  telegramChatId: string,
  telegramUserId: string,
  telegramUsername?: string,
) {
  if (!payload?.startsWith('link_')) {
    return { ok: true, message: 'Добро пожаловать в FindMe. Для привязки аккаунта откройте ссылку из профиля.' };
  }

  const code = payload.slice('link_'.length);
  if (!code) {
    return { ok: false, message: 'Некорректный код привязки.' };
  }

  const now = new Date();
  const linkToken = await prisma.telegramLinkToken.findFirst({
    where: {
      code,
      usedAt: null,
      expiresAt: { gt: now },
    },
  });

  if (!linkToken) {
    return { ok: false, message: 'Ссылка привязки недействительна или устарела.' };
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: linkToken.userId },
        data: {
          telegramChatId,
          telegramUserId,
          telegramLinkedAt: now,
          ...(telegramUsername ? { telegramUsername } : {}),
        },
      }),
      prisma.telegramLinkToken.update({
        where: { id: linkToken.id },
        data: { usedAt: now },
      }),
    ]);
  } catch {
    return { ok: false, message: 'Этот Telegram-аккаунт уже привязан к другому пользователю.' };
  }

  return { ok: true, message: 'Telegram успешно привязан к вашему аккаунту FindMe.' };
}

export async function sendTelegramUserNotification(input: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      telegramChatId: true,
      notificationSettings: { select: { notifyTelegram: true } },
    },
  });

  if (!user?.telegramChatId) return { ok: false, skipped: true };
  if (!user.notificationSettings?.notifyTelegram) return { ok: false, skipped: true };

  const baseUrl = getAppBaseUrl();
  const fullLink = input.link && baseUrl ? `${baseUrl}${input.link}` : '';
  const actionLabel = fullLink ? buildTelegramActionLabel(input.link || '') : '';
  const replyMarkup = buildTelegramButton(actionLabel, fullLink);
  const linkPreview = fullLink ? buildTelegramLinkPreview(fullLink, actionLabel) : '';
  const text = [
    `🔔 <b>${escapeTelegramHtml(input.title)}</b>`,
    escapeTelegramHtml(input.message),
    linkPreview,
  ]
    .filter(Boolean)
    .join('\n\n');

  return sendTelegramMessageWithButton(user.telegramChatId, text, replyMarkup);
}

export async function sendAdApprovedToTelegramChannel(ad: ApprovedAdPayload) {
  const chatId = env.telegramChannelId;
  if (!env.telegramBotToken || !chatId) {
    return { ok: false, skipped: true, description: 'missing telegram bot token or channel id' };
  }

  const appBaseUrl = getAppBaseUrl();
  const link = appBaseUrl ? `${appBaseUrl}/ads/${ad.id}` : '';
  const replyMarkup = buildTelegramButton('Перейти к объявлению', link);

  const photos = await resolveTelegramPhotoInputs(ad);
  const captionText = buildApprovedAdCaption(ad, link);
  const messageText = buildApprovedAdMessage(ad);

  if (ad.photos?.length && !photos.length) {
    console.warn('[telegram] skipped ad photos because local files and PUBLIC_API_URL are unavailable', {
      adId: ad.id,
      publicApiUrl: env.publicApiUrl,
    });
  }

  if (photos.length === 1) {
    const photoResult = await sendTelegramPhoto(chatId, photos[0]!, captionText, replyMarkup);
    if (!photoResult.ok) {
      console.warn('[telegram] failed to send approved ad photo', {
        adId: ad.id,
        description: photoResult.description,
      });
    }

    return photoResult;
  }

  if (photos.length > 1) {
    const mediaGroupResult = await sendTelegramMediaGroup(chatId, photos, captionText);
    if (!mediaGroupResult.ok) {
      console.warn('[telegram] failed to send approved ad media group', {
        adId: ad.id,
        description: mediaGroupResult.description,
      });
      return mediaGroupResult;
    }

    const firstMessageId = mediaGroupResult.result?.[0]?.message_id;
    if (replyMarkup && firstMessageId) {
      const replyMarkupResult = await editTelegramMessageReplyMarkup(chatId, firstMessageId, replyMarkup);
      if (!replyMarkupResult.ok) {
        console.warn('[telegram] failed to attach reply markup to approved ad media group', {
          adId: ad.id,
          description: replyMarkupResult.description,
        });
      }
    }

    return mediaGroupResult;
  }

  const messageResult = await sendTelegramMessageWithButton(chatId, messageText, replyMarkup);
  if (!messageResult.ok) {
    console.warn('[telegram] failed to send approved ad message', {
      adId: ad.id,
      description: messageResult.description,
    });
  }

  return messageResult;
}
