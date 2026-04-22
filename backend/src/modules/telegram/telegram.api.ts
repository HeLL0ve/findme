import { Buffer } from 'node:buffer';

import { env } from '../../config/env';

type TelegramApiResult<T> = {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
};

type TelegramFileInput = {
  buffer: Buffer;
  filename: string;
};

type TelegramPhotoInput = string | TelegramFileInput;

type TelegramUpdate = {
  update_id: number;
  message?: {
    text?: string;
    chat?: { id: number | string };
    from?: { id: number | string; username?: string; first_name?: string };
  };
};

type TelegramSentMessage = {
  message_id: number;
};

function getBotToken() {
  return env.telegramBotToken;
}

async function callTelegram<T>(method: string, payload: Record<string, unknown>) {
  const token = getBotToken();
  if (!token) return { ok: false, description: 'missing bot token' } as TelegramApiResult<T>;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = (await response.json()) as TelegramApiResult<T>;
      if (!response.ok && !data.description) {
        return {
          ok: false,
          error_code: response.status,
          description: `telegram http ${response.status}`,
        } as TelegramApiResult<T>;
      }

      return data;
    }

    const body = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        error_code: response.status,
        description: body || `telegram http ${response.status}`,
      } as TelegramApiResult<T>;
    }

    return {
      ok: false,
      error_code: response.status,
      description: 'telegram returned a non-json response',
    } as TelegramApiResult<T>;
  } catch (error) {
    return {
      ok: false,
      description: error instanceof Error ? error.message : 'telegram request failed',
    } as TelegramApiResult<T>;
  }
}

async function callTelegramMultipart<T>(method: string, formData: FormData) {
  const token = getBotToken();
  if (!token) return { ok: false, description: 'missing bot token' } as TelegramApiResult<T>;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      body: formData,
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = (await response.json()) as TelegramApiResult<T>;
      if (!response.ok && !data.description) {
        return {
          ok: false,
          error_code: response.status,
          description: `telegram http ${response.status}`,
        } as TelegramApiResult<T>;
      }

      return data;
    }

    const body = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        error_code: response.status,
        description: body || `telegram http ${response.status}`,
      } as TelegramApiResult<T>;
    }

    return {
      ok: false,
      error_code: response.status,
      description: 'telegram returned a non-json response',
    } as TelegramApiResult<T>;
  } catch (error) {
    return {
      ok: false,
      description: error instanceof Error ? error.message : 'telegram request failed',
    } as TelegramApiResult<T>;
  }
}

function appendOptionalTextField(formData: FormData, key: string, value?: string) {
  if (value) formData.append(key, value);
}

function appendOptionalJsonField(formData: FormData, key: string, value?: Record<string, unknown>) {
  if (value) formData.append(key, JSON.stringify(value));
}

function toBlobPart(buffer: Buffer) {
  return Uint8Array.from(buffer);
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
  photo: TelegramPhotoInput,
  caption?: string,
  replyMarkup?: Record<string, unknown>,
) {
  if (typeof photo === 'string') {
    return callTelegram('sendPhoto', {
      chat_id: chatId,
      photo,
      caption,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });
  }

  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('photo', new Blob([toBlobPart(photo.buffer)]), photo.filename);
  appendOptionalTextField(formData, 'caption', caption);
  appendOptionalTextField(formData, 'parse_mode', caption ? 'HTML' : undefined);
  appendOptionalJsonField(formData, 'reply_markup', replyMarkup);

  return callTelegramMultipart('sendPhoto', formData);
}

export async function sendTelegramMediaGroup(chatId: string, photos: TelegramPhotoInput[], caption?: string) {
  if (photos.every((photo) => typeof photo === 'string')) {
    const media = photos.map((url, index) => ({
      type: 'photo',
      media: url,
      ...(index === 0 && caption ? { caption, parse_mode: 'HTML' } : {}),
    }));

    return callTelegram<TelegramSentMessage[]>('sendMediaGroup', {
      chat_id: chatId,
      media,
    });
  }

  const formData = new FormData();
  formData.append('chat_id', chatId);

  const media = photos.map((photo, index) => {
    if (typeof photo === 'string') {
      return {
        type: 'photo',
        media: photo,
        ...(index === 0 && caption ? { caption, parse_mode: 'HTML' } : {}),
      };
    }

    const attachName = `photo_${index}`;
    formData.append(attachName, new Blob([toBlobPart(photo.buffer)]), photo.filename);

    return {
      type: 'photo',
      media: `attach://${attachName}`,
      ...(index === 0 && caption ? { caption, parse_mode: 'HTML' } : {}),
    };
  });

  formData.append('media', JSON.stringify(media));
  return callTelegramMultipart<TelegramSentMessage[]>('sendMediaGroup', formData);
}

export async function editTelegramMessageReplyMarkup(
  chatId: string,
  messageId: number,
  replyMarkup?: Record<string, unknown>,
) {
  return callTelegram('editMessageReplyMarkup', {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: replyMarkup,
  });
}

export type { TelegramFileInput, TelegramPhotoInput };

export async function getTelegramUpdates(offset?: number) {
  return callTelegram<TelegramUpdate[]>('getUpdates', {
    ...(offset !== undefined ? { offset } : {}),
    timeout: 0,
    limit: 50,
  });
}
