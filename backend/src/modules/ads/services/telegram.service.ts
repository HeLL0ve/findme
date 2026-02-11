import { env } from '../../../config/env';

type TelegramResult = { ok: boolean; skipped?: boolean; error?: string };

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
    // Заглушка: просто логируем, пока нет токена/канала
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
  const color = ad.color ? `Цвет: ${ad.color}` : '';
  const address = ad.location?.address ? `Адрес: ${ad.location.address}` : '';
  const city = ad.location?.city ? `Город: ${ad.location.city}` : '';

  const text = [title, name, animal, breed, color, city, address, '', ad.description, '', `ID: ${ad.id}`]
    .filter(Boolean)
    .join('\n');

  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      return { ok: false, error: body };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'unknown' };
  }
}
