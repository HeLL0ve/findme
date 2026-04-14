import { env } from '../../config/env';
import { getTelegramUpdates, sendTelegramMessage } from './telegram.api';
import { processTelegramStart } from './telegram.service';

let pollingStarted = false;
let updateOffset: number | undefined;
let busy = false;

async function handleUpdate(update: {
  update_id: number;
  message?: {
    text?: string;
    chat?: { id: number | string };
    from?: { id: number | string; username?: string };
  };
}) {
  const message = update.message;
  const text = message?.text?.trim();
  if (!message || !text || !text.startsWith('/start')) return;

  const chatId = message.chat?.id;
  const fromId = message.from?.id;
  if (chatId === undefined || fromId === undefined) return;

  const payload = text.split(/\s+/, 2)[1];
  const result = await processTelegramStart(
    payload,
    String(chatId),
    String(fromId),
    message.from?.username,
  );

  await sendTelegramMessage(String(chatId), result.message);
}

async function pollTelegram() {
  if (busy) return;
  busy = true;
  try {
    const response = await getTelegramUpdates(updateOffset);
    if (!response.ok || !response.result) return;

    for (const update of response.result) {
      await handleUpdate(update);
      updateOffset = update.update_id + 1;
    }
  } catch (error) {
    console.error('[telegram-bot] polling error', error);
  } finally {
    busy = false;
  }
}

export function startTelegramBot() {
  if (pollingStarted) return;
  if (!env.telegramBotToken) return;

  pollingStarted = true;
  setInterval(() => {
    void pollTelegram();
  }, 5000);

  console.log('[telegram-bot] polling started');
}
