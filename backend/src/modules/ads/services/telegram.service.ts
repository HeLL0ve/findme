import { env } from '../../../config/env';

type TelegramResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
};

export async function sendAdApprovedToTelegram(ad: {
  id: string;
  type: string;
  status: string;
  petName: string | null;
  animalType: string | null;
  breed: string | null;
  color: string | null;
  description: string;
  location?: { address: string | null; city?: string | null } | null;
}): Promise<TelegramResult> {
  const token = env.telegramBotToken;
  const chatId = env.telegramChannelId;

  if (!token || !chatId) {
    console.log('[telegram] skipped: missing token/channel', {
      adId: ad.id,
      petName: ad.petName,
      type: ad.type,
      status: ad.status,
    });
    return { ok: false, skipped: true };
  }

  const title = ad.type === 'LOST' ? 'Потерян питомец' : 'Найден питомец';
  const name = ad.petName ? `Кличка: ${ad.petName}` : '';
  const animal = ad.animalType ? `Вид: ${ad.animalType}` : '';
  const breed = ad.breed ? `Порода: ${ad.breed}` : '';
  const coat = ad.color ? `Окрас: ${ad.color}` : '';
  const city = ad.location?.city ? `Город: ${ad.location.city}` : '';
  const address = ad.location?.address ? `Адрес: ${ad.location.address}` : '';

  const text = [title, name, animal, breed, coat, city, address, '', ad.description, '', `ID: ${ad.id}`]
    .filter(Boolean)
    .join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { ok: false, error: body };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'unknown' };
  }
}
