import { env } from '../../config/env';

type TelegramApiResult<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

type TelegramUpdate = {
  update_id: number;
  message?: {
    text?: string;
    chat?: { id: number | string };
    from?: { id: number | string; username?: string; first_name?: string };
  };
};

function getBotToken() {
  return env.telegramBotToken;
}

async function callTelegram<T>(method: string, payload: Record<string, unknown>) {
  const token = getBotToken();
  if (!token) return { ok: false, description: 'missing bot token' } as TelegramApiResult<T>;

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false, description: body } as TelegramApiResult<T>;
  }

  const data = (await response.json()) as TelegramApiResult<T>;
  return data;
}

export async function sendTelegramMessage(chatId: string, text: string) {
  return callTelegram('sendMessage', { chat_id: chatId, text });
}

export async function sendTelegramMessageWithButton(
  chatId: string,
  text: string,
  replyMarkup?: Record<string, unknown>,
) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

export async function sendTelegramPhoto(
  chatId: string,
  photoUrl: string,
  caption?: string,
  replyMarkup?: Record<string, unknown>,
) {
  return callTelegram('sendPhoto', {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

export async function sendTelegramMediaGroup(chatId: string, photos: string[], caption?: string) {
  const media = photos.map((url, index) => ({
    type: 'photo',
    media: url,
    ...(index === 0 && caption ? { caption, parse_mode: 'HTML' } : {}),
  }));

  return callTelegram('sendMediaGroup', {
    chat_id: chatId,
    media,
  });
}

export async function getTelegramUpdates(offset?: number) {
  return callTelegram<TelegramUpdate[]>('getUpdates', {
    ...(offset !== undefined ? { offset } : {}),
    timeout: 0,
    limit: 50,
  });
}
