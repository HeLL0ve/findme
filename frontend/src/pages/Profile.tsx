import { useEffect, useMemo, useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Link } from 'react-router-dom';
import { Avatar, Badge, Button, Card, Container, Dialog, Flex, Grid, Heading, Text, TextField } from '@radix-ui/themes';
import { api } from '../api/axios';
import { extractApiErrorMessage } from '../shared/apiError';
import { useAuthStore } from '../shared/authStore';
import { config } from '../shared/config';
import { adStatusLabel, adTypeLabel, roleLabel } from '../shared/labels';

type ProfileDto = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  telegramUsername?: string | null;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN';
  notificationSettings?: {
    notifyWeb: boolean;
    notifyTelegram: boolean;
  } | null;
};

type MyAd = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  breed?: string | null;
  color?: string | null;
  type: 'LOST' | 'FOUND';
  status: string;
  photos?: Array<{ photoUrl: string }>;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  repeatPassword: string;
};

function resolveAvatarSrc(avatarUrl?: string | null) {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  if (!config.apiUrl) return avatarUrl;
  return `${config.apiUrl}${avatarUrl}`;
}

function resolvePhotoSrc(photoUrl?: string | null) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${config.apiUrl || ''}${photoUrl}`;
}

export default function Profile() {
  const setUser = useAuthStore((state) => state.setUser);
  const authUser = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [form, setForm] = useState<Partial<ProfileDto>>({});
  const [myAds, setMyAds] = useState<MyAd[]>([]);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    repeatPassword: '',
  });

  const initials = useMemo(
    () => (form.name || form.email || 'U').slice(0, 1).toUpperCase(),
    [form.email, form.name],
  );
  const avatarSrc = resolveAvatarSrc(form.avatarUrl);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [profileResponse, adsResponse] = await Promise.all([
          api.get('/users/me'),
          api.get('/ads/my'),
        ]);
        if (!mounted) return;
        setForm(profileResponse.data);
        setUser(profileResponse.data);
        setMyAds(adsResponse.data);
      } catch (err) {
        if (!mounted) return;
        setError(extractApiErrorMessage(err, 'Ошибка загрузки профиля'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [setUser]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await api.put('/users/me', {
        name: form.name,
        phone: form.phone,
        telegramUsername: form.telegramUsername,
        notifyWeb: form.notificationSettings?.notifyWeb,
        notifyTelegram: form.notificationSettings?.notifyTelegram,
      });
      setForm(response.data);
      setUser(response.data);
      setSuccess('Профиль сохранен');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Ошибка сохранения профиля'));
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Можно загрузить только изображение');
      return;
    }

    const payload = new FormData();
    payload.append('avatar', file);

    setError(null);
    setSuccess(null);
    try {
      const response = await api.post('/users/me/avatar', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, avatarUrl: response.data.avatarUrl }));
      if (authUser) setUser({ ...authUser, avatarUrl: response.data.avatarUrl });
      setSuccess('Аватар обновлен');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось обновить аватар'));
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.repeatPassword) {
      setError('Заполните все поля для смены пароля');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Новый пароль должен быть не менее 6 символов');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.repeatPassword) {
      setError('Новый пароль и подтверждение не совпадают');
      return;
    }

    try {
      await api.post('/users/me/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({ currentPassword: '', newPassword: '', repeatPassword: '' });
      setChangePasswordOpen(false);
      setSuccess('Пароль обновлен');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось изменить пароль'));
    }
  }

  async function handleNotifyWebChange(value: boolean) {
    if (value && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {
        // ignore browser permission errors
      }
    }

    setForm((prev) => ({
      ...prev,
      notificationSettings: {
        notifyWeb: value,
        notifyTelegram: Boolean(prev.notificationSettings?.notifyTelegram),
      },
    }));
  }

  if (loading) return <Container size="4"><Text>Загрузка...</Text></Container>;

  return (
    <Container size="4">
      <Flex direction="column" gap="4">
        <Card>
          <Heading size="7">Профиль</Heading>
          <form onSubmit={saveProfile} className="form-root" style={{ marginTop: 16 }}>
            <Flex direction="column" gap="3">
              <Flex align="center" gap="3" wrap="wrap">
                <Avatar src={avatarSrc} fallback={initials} size="6" radius="full" />
                <Flex direction="column" gap="1">
                  <Text size="2" color="gray">Аватар</Text>
                  <input type="file" accept="image/*" onChange={uploadAvatar} />
                </Flex>
              </Flex>

              <Text size="2" color="gray">Email</Text>
              <Text>{form.email}</Text>

              <TextField.Root
                placeholder="Имя"
                value={form.name ?? ''}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
              <TextField.Root
                placeholder="Телефон (+375XXXXXXXXX)"
                value={form.phone ?? ''}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                pattern="\\+375(25|29|33|44)\\d{7}"
              />
              <TextField.Root
                placeholder="Telegram username"
                value={form.telegramUsername ?? ''}
                onChange={(event) => setForm({ ...form, telegramUsername: event.target.value })}
              />

              <Flex direction="column" gap="2">
                <Text size="2" color="gray">Уведомления</Text>
                <Flex align="center" gap="2">
                  <Checkbox.Root
                    checked={!!form.notificationSettings?.notifyWeb}
                    onCheckedChange={(value) => void handleNotifyWebChange(Boolean(value))}
                    id="notifyWeb"
                    className="checkbox"
                  >
                    <Checkbox.Indicator className="checkbox-indicator">✓</Checkbox.Indicator>
                  </Checkbox.Root>
                  <label htmlFor="notifyWeb">Web-уведомления</label>
                </Flex>

                <Flex align="center" gap="2">
                  <Checkbox.Root
                    checked={!!form.notificationSettings?.notifyTelegram}
                    onCheckedChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        notificationSettings: {
                          notifyWeb: Boolean(prev.notificationSettings?.notifyWeb),
                          notifyTelegram: Boolean(value),
                        },
                      }))}
                    id="notifyTelegram"
                    className="checkbox"
                  >
                    <Checkbox.Indicator className="checkbox-indicator">✓</Checkbox.Indicator>
                  </Checkbox.Root>
                  <label htmlFor="notifyTelegram">Telegram-уведомления</label>
                </Flex>
              </Flex>

              <Text size="2">Роль: {roleLabel(form.role)}</Text>

              <Flex gap="2" wrap="wrap">
                <Button type="submit">Сохранить профиль</Button>
                <Dialog.Root open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                  <Dialog.Trigger>
                    <Button type="button" variant="soft">Сменить пароль</Button>
                  </Dialog.Trigger>
                  <Dialog.Content maxWidth="440px">
                    <Dialog.Title>Смена пароля</Dialog.Title>
                    <form onSubmit={changePassword} className="form-root" style={{ marginTop: 12 }}>
                      <TextField.Root
                        type="password"
                        placeholder="Текущий пароль"
                        value={passwordForm.currentPassword}
                        onChange={(event) =>
                          setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                      />
                      <TextField.Root
                        type="password"
                        placeholder="Новый пароль"
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                      />
                      <TextField.Root
                        type="password"
                        placeholder="Повторите новый пароль"
                        value={passwordForm.repeatPassword}
                        onChange={(event) =>
                          setPasswordForm({ ...passwordForm, repeatPassword: event.target.value })}
                      />
                      <Flex justify="end" gap="2">
                        <Dialog.Close>
                          <Button type="button" variant="soft">Отмена</Button>
                        </Dialog.Close>
                        <Button type="submit">Обновить</Button>
                      </Flex>
                    </form>
                  </Dialog.Content>
                </Dialog.Root>
              </Flex>

              {error && <Text color="red">{error}</Text>}
              {success && <Text color="green">{success}</Text>}
            </Flex>
          </form>
        </Card>

        <Flex direction="column" gap="2">
          <Heading size="6">Мои объявления</Heading>
          {myAds.length === 0 && <Text color="gray">У вас пока нет объявлений.</Text>}
          <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="3">
            {myAds.map((ad) => {
              const photoSrc = resolvePhotoSrc(ad.photos?.[0]?.photoUrl);
              return (
                <Card key={ad.id} asChild>
                  <Link to={`/ads/${ad.id}`} style={{ textDecoration: 'none' }}>
                    <Flex direction="column" gap="3">
                      <div
                        style={{
                          width: '100%',
                          height: 220,
                          borderRadius: 12,
                          background: 'var(--accent-soft)',
                          overflow: 'hidden',
                        }}
                      >
                        {photoSrc && (
                          <img
                            src={photoSrc}
                            alt={ad.petName || 'Фото объявления'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                      </div>
                      <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
                        <Text weight="bold" className="truncate">{ad.petName || 'Без клички'}</Text>
                        <Text size="2" color="gray" className="truncate">
                          {[ad.animalType || 'Не указано', ad.breed || null, ad.color ? `окрас: ${ad.color}` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                        <Flex gap="2" wrap="wrap">
                          <Badge color={ad.type === 'LOST' ? 'orange' : 'green'}>{adTypeLabel(ad.type)}</Badge>
                          <Badge color={ad.status === 'APPROVED' ? 'blue' : 'gray'}>{adStatusLabel(ad.status)}</Badge>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Link>
                </Card>
              );
            })}
          </Grid>
        </Flex>
      </Flex>
    </Container>
  );
}
