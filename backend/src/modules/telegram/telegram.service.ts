import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { createRawToken } from '../../shared/security/tokenHash';
import { sendTelegramMessage, sendTelegramMessageWithButton, sendTelegramPhoto, sendTelegramMediaGroup } from './telegram.api';

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

function buildBotStartLink(code: string) {
  if (!env.telegramBotUsername) return '';
  return `https://t.me/${env.telegramBotUsername}?start=link_${code}`;
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

  const fullLink = input.link ? `${env.appUrl.replace(/\/+$/, '')}${input.link}` : '';
  const text = [input.title, input.message, fullLink].filter(Boolean).join('\n');
  return sendTelegramMessage(user.telegramChatId, text);
}

export async function sendAdApprovedToTelegramChannel(ad: ApprovedAdPayload) {
  const chatId = env.telegramChannelId;
  if (!env.telegramBotToken || !chatId) return { ok: false, skipped: true };

  const title = ad.type === 'LOST' ? 'Потерян питомец' : 'Найден питомец';
  const name = ad.petName ? `<b>Кличка:</b> ${ad.petName}` : '';
  const animal = ad.animalType ? `<b>Вид:</b> ${ad.animalType}` : '';
  const breed = ad.breed ? `<b>Порода:</b> ${ad.breed}` : '';
  const coat = ad.color ? `<b>Окрас:</b> ${ad.color}` : '';
  const city = ad.location?.city ? `<b>Город:</b> ${ad.location.city}` : '';
  const address = ad.location?.address ? `<b>Адрес:</b> ${ad.location.address}` : '';
  const link = `${env.appUrl.replace(/\/+$/, '')}/ads/${ad.id}`;

  const textParts = [
    `<b>${title}</b>`,
    name,
    animal,
    breed,
    coat,
    city,
    address,
    `<b>Описание:</b> ${ad.description}`,
  ].filter(Boolean);

  const caption = textParts.join('\n');

  // Prepare reply markup with clickable link button
  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '📌 Открыть объявление',
          url: link,
        },
      ],
    ],
  };

  // Get photos with full URLs
  const photos = (ad.photos || [])
    .map((p) => {
      if (p.photoUrl.startsWith('http')) return p.photoUrl;
      return `${env.appUrl.replace(/\/+$/, '')}${p.photoUrl}`;
    })
    .slice(0, 10); // Telegram limit

  if (photos.length > 0) {
    if (photos.length === 1) {
      // Send single photo with caption and button
      return sendTelegramPhoto(chatId, photos[0], caption, replyMarkup);
    } else {
      // Send multiple photos as media group, then send caption with button
      await sendTelegramMediaGroup(chatId, photos, caption);
      return sendTelegramMessageWithButton(chatId, `<a href="${link}">📌 Открыть объявление</a>`, replyMarkup);
    }
  } else {
    // No photos, send text message with button
    return sendTelegramMessageWithButton(chatId, caption, replyMarkup);
  }
}
