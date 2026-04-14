import { sendAdApprovedToTelegramChannel } from '../../telegram/telegram.service';

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
  photos?: Array<{ photoUrl: string }>;
}): Promise<TelegramResult> {
  const result = await sendAdApprovedToTelegramChannel(ad);
  return { ok: result.ok, skipped: !result.ok };
}
