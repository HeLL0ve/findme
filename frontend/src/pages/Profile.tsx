import { useEffect, useMemo, useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Avatar, Button, Card, Container, Dialog, Flex, Grid, Heading, Text, TextField, Badge } from '@radix-ui/themes';
import { api } from '../api/axios';
import AdCard, { type AdCardData } from '../components/ads/AdCard';
import { extractApiErrorMessage } from '../shared/apiError';
import { useAuthStore } from '../shared/authStore';
import { config } from '../shared/config';
import { roleLabel } from '../shared/labels';
import { PasswordField } from '../components/common/PasswordField';
import { usePageTitle } from '../shared/usePageTitle';
import {
  UserIcon,
  InfoIcon,
  BellIcon,
  LockIcon,
  AddIcon,
  DescriptionIcon,
} from '../components/common/Icons';

type ProfileDto = {
  id: string;
  email: string;
  emailVerifiedAt?: string | null;
  name?: string | null;
  phone?: string | null;
  telegramUsername?: string | null;
  telegramLinked?: boolean;
  telegramLinkedAt?: string | null;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN';
  notificationSettings?: {
    notifyWeb: boolean;
    notifyTelegram: boolean;
  } | null;
};

type MyAd = AdCardData;

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

export default function Profile() {
  const setUser = useAuthStore((state) => state.setUser);
  const authUser = useAuthStore((state) => state.user);
  usePageTitle('Профиль');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [telegramActionLoading, setTelegramActionLoading] = useState(false);
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
    let shouldEnable = value;

    // Если пытаемся включить, запросим разрешение у браузера
    if (value && typeof Notification !== 'undefined') {
      if (Notification.permission === 'denied') {
        // Тихо отключаем — браузер уже запретил, пользователь сам разберётся в настройках
        shouldEnable = false;
      } else if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            shouldEnable = false;
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          shouldEnable = false;
        }
      }
    }

    const newSettings = {
      notifyWeb: shouldEnable,
      notifyTelegram: Boolean(form.notificationSettings?.notifyTelegram),
    };

    setForm((prev) => ({
      ...prev,
      notificationSettings: newSettings,
    }));

    // Instantly save to backend
    try {
      await api.put('/users/me', {
        notifyWeb: shouldEnable,
        notifyTelegram: newSettings.notifyTelegram,
      });
    } catch (err) {
      console.error('Failed to save notification settings:', err);
      setError('Не удалось сохранить настройки уведомлений');
    }
  }

  async function handleNotifyTelegramChange(value: boolean) {
    const newSettings = {
      notifyWeb: Boolean(form.notificationSettings?.notifyWeb),
      notifyTelegram: value,
    };

    setForm((prev) => ({
      ...prev,
      notificationSettings: newSettings,
    }));

    // Instantly save to backend
    try {
      await api.put('/users/me', {
        notifyWeb: newSettings.notifyWeb,
        notifyTelegram: value,
      });
    } catch (err) {
      console.error('Failed to save notification settings:', err);
    }
  }

  async function generateTelegramLink() {
    setError(null);
    setSuccess(null);
    setTelegramActionLoading(true);
    try {
      const response = await api.get('/telegram/link');
      const link = response.data?.link as string | undefined;
      if (!link) {
        setError('Не удалось сформировать ссылку привязки. Проверьте TELEGRAM_BOT_USERNAME в .env');
        return;
      }
      window.open(link, '_blank', 'noopener,noreferrer');
      setSuccess('Откройте Telegram по ссылке и отправьте /start боту.');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось сформировать ссылку привязки Telegram'));
    } finally {
      setTelegramActionLoading(false);
    }
  }

  async function unlinkTelegramAccount() {
    setError(null);
    setSuccess(null);
    setTelegramActionLoading(true);
    try {
      await api.post('/telegram/unlink');
      setForm((prev) => ({
        ...prev,
        telegramLinked: false,
        telegramLinkedAt: null,
      }));
      setSuccess('Telegram-аккаунт отвязан');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отвязать Telegram'));
    } finally {
      setTelegramActionLoading(false);
    }
  }

  if (loading) return <Container size="4"><Text>Загрузка...</Text></Container>;

  return (
    <Flex direction="column" gap="0">
      {/* Header */}
      <Flex direction="column" gap="2" style={{
        background: 'linear-gradient(135deg, var(--violet-2) 0%, var(--accent-soft) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
        padding: 'var(--space-4)',
      }}>
        <Container size="4">
          <Flex gap="2" align="center">
            <UserIcon width={28} height={28} />
            <Heading size="7" weight="bold" style={{margin:'0px'}}>Профиль</Heading>
          </Flex>
          <Text color="gray" size="2">Управляйте вашими данными, настройками и объявлениями</Text>
        </Container>
      </Flex>

      <Container size="4" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
        <Flex direction={{ initial: 'column', md: 'row' }} gap="6">
          {/* Left Column - Profile Settings */}
          <Flex direction="column" gap="4" style={{ flex: 1 }}>
            {/* Avatar & Basic Info */}
            <Card>
              <Flex direction="column" gap="4">
                <Flex gap="2" align="center">
                  <Heading size="4" weight="bold">Аватар профиля</Heading>
                </Flex>

                <Flex align="center" gap="4" direction={{ initial: 'column', sm: 'row' }}>
                  <Avatar src={avatarSrc} fallback={initials} size="7" radius="full" style={{
                    border: '3px solid var(--violet-8)',
                  }} />
                  <Flex direction="column" gap="3" style={{ flex: 1 }}>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="bold" color="gray">Загрузить новый аватар</Text>
                      <Text size="1" color="gray">Поддерживаются JPG, PNG, до 5 МБ</Text>
                    </Flex>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      cursor: 'pointer',
                      background: 'var(--violet-3)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-2)',
                      fontWeight: 600,
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                    }} onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = 'var(--violet-4)';
                    }} onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = 'var(--violet-3)';
                    }}>
                      Выбрать файл
                      <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
                    </label>
                  </Flex>
                </Flex>
              </Flex>
            </Card>

            {/* Basic Information */}
            <Card>
              <form onSubmit={saveProfile} className="form-root">
                <Flex direction="column" gap="4">
                  <Flex gap="2" align="center">
                    <InfoIcon width={20} height={20} />
                    <Heading size="4" weight="bold" style={{margin:'0px'}}>Основная информация</Heading>
                  </Flex>

                  <Flex direction="column" gap="3">
                    <Flex direction="column" gap="2">
                      <Text size="2" weight="bold" color="gray">Email *</Text>
                      <Card style={{
                        background: 'var(--gray-a1)',
                        padding: 'var(--space-2) var(--space-3)',
                      }}>
                        <Flex justify="between" align="center" gap="2">
                          <Text size="2">{form.email}</Text>
                          <Badge size="1" color={form.emailVerifiedAt ? 'green' : 'orange'}>
                            {form.emailVerifiedAt ? 'Подтвержден' : 'Не подтвержден'}
                          </Badge>
                        </Flex>
                      </Card>
                    </Flex>

                    <Flex direction="column" gap="2">
                      <Text size="2" weight="bold" color="gray">Имя</Text>
                      <TextField.Root
                        placeholder="Ваше имя"
                        value={form.name ?? ''}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                      />
                    </Flex>

                    <Flex direction="column" gap="2">
                      <Text size="2" weight="bold" color="gray">Телефон</Text>
                      <TextField.Root
                        placeholder="+375XXXXXXXXX"
                        value={form.phone ?? ''}
                        onChange={(event) => setForm({ ...form, phone: event.target.value })}
                        type="tel"
                      />
                      <Text size="1" color="gray">Видно только людям, с которыми вы общались</Text>
                    </Flex>
                  </Flex>

                  <Button type="submit" size="2" style={{ width: '100%', fontWeight: 600 }}>
                    Сохранить изменения
                  </Button>
                </Flex>
              </form>
            </Card>

            {/* Telegram */}
            <Card style={{
              background: 'var(--blue-a1)',
              border: '1px solid var(--blue-a6)',
            }}>
              <Flex direction="column" gap="4">
                <Heading size="4" weight="bold">Telegram</Heading>

                <Flex direction="column" gap="3">
                  <Flex direction="column" gap="2">
                    <Text size="2" weight="bold" color="gray">Username Telegram (опционально)</Text>
                    <form onSubmit={saveProfile}>
                      <TextField.Root
                        placeholder="@yourusername"
                        value={form.telegramUsername ?? ''}
                        onChange={(event) => setForm({ ...form, telegramUsername: event.target.value })}
                      />
                    </form>
                    <Text size="1" color="gray">Людям будет показан ваш username для связи</Text>
                  </Flex>

                  <Flex direction="column" gap="2">
                    <Text size="2" weight="bold" color="gray">Статус привязки</Text>
                    <Card style={{
                      background: form.telegramLinked ? 'var(--green-2)' : 'var(--gray-a1)',
                      padding: 'var(--space-2) var(--space-3)',
                    }}>
                      <Flex justify="between" align="center" gap="2">
                        <Text size="2">
                          {form.telegramLinked ? 'Аккаунт привязан' : 'Аккаунт не привязан'}
                        </Text>
                        <Text size="1" color="gray">{form.telegramLinkedAt ? new Date(form.telegramLinkedAt).toLocaleDateString() : ''}</Text>
                      </Flex>
                    </Card>
                  </Flex>

                  <Flex gap="2" direction={{ initial: 'column', sm: 'row' }}>
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => void generateTelegramLink()}
                      disabled={telegramActionLoading}
                      style={{ flex: 1, fontWeight: 600 }}
                    >
                      {telegramActionLoading ? '⏳' : 'Привязать Telegram'}
                    </Button>
                    {form.telegramLinked && (
                      <Button
                        type="button"
                        color="orange"
                        variant="soft"
                        onClick={() => void unlinkTelegramAccount()}
                        disabled={telegramActionLoading}
                        style={{ flex: 1, fontWeight: 600 }}
                      >
                        {telegramActionLoading ? '⏳' : 'Отвязать'}
                      </Button>
                    )}
                  </Flex>
                </Flex>
              </Flex>
            </Card>

            {/* Notifications */}
            <Card>
              <Flex direction="column" gap="4">
                <Flex gap="2" align="center">
                  <BellIcon width={20} height={20} />
                  <Heading size="4" weight="bold" style={{margin:'0px'}}>Уведомления</Heading>
                </Flex>

                <Flex direction="column" gap="3">
                  <Flex align="center" gap="3" p="3" style={{
                    background: form.notificationSettings?.notifyWeb ? 'var(--green-a1)' : 'var(--gray-a1)',
                    borderRadius: 'var(--radius-2)',
                    border: form.notificationSettings?.notifyWeb ? '1px solid var(--green-a6)' : '1px solid var(--gray-a6)',
                    cursor: 'pointer',
                  }} onClick={() => void handleNotifyWebChange(!form.notificationSettings?.notifyWeb)}>
                    <Checkbox.Root
                      checked={!!form.notificationSettings?.notifyWeb}
                      onCheckedChange={(value) => void handleNotifyWebChange(Boolean(value))}
                      className="checkbox"
                    >
                      <Checkbox.Indicator className="checkbox-indicator">✓</Checkbox.Indicator>
                    </Checkbox.Root>
                    <Flex direction="column" gap="1">
                      <Text weight="bold">Web-уведомления</Text>
                      <Text size="1" color="gray">Получайте уведомления в браузере</Text>
                    </Flex>
                  </Flex>

                  <Flex align="center" gap="3" p="3" style={{
                    background: form.notificationSettings?.notifyTelegram ? 'var(--blue-a1)' : 'var(--gray-a1)',
                    borderRadius: 'var(--radius-2)',
                    border: form.notificationSettings?.notifyTelegram ? '1px solid var(--blue-a6)' : '1px solid var(--gray-a6)',
                    cursor: 'pointer',
                  }} onClick={() => void handleNotifyTelegramChange(!form.notificationSettings?.notifyTelegram)}>
                    <Checkbox.Root
                      checked={!!form.notificationSettings?.notifyTelegram}
                      onCheckedChange={(value) => void handleNotifyTelegramChange(Boolean(value))}
                      className="checkbox"
                    >
                      <Checkbox.Indicator className="checkbox-indicator">✓</Checkbox.Indicator>
                    </Checkbox.Root>
                    <Flex direction="column" gap="1">
                      <Text weight="bold">Telegram-уведомления</Text>
                      <Text size="1" color="gray">Получайте уведомления в Telegram {form.telegramLinked ? '(привязан)' : '(не привязан)'}</Text>
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            </Card>

            {/* Password & Security */}
            <Card style={{
              background: 'var(--red-a1)',
              border: '1px solid var(--red-a6)',
            }}>
              <Flex direction="column" gap="4">
                <Flex gap="2" align="center">
                  <LockIcon width={20} height={20} />
                  <Heading size="4" weight="bold" style={{margin:'0px'}}>Безопасность</Heading>
                </Flex>

                <Flex direction="column" gap="2">
                  <Text size="2" color="gray">Статус роли: <Text weight="bold">{roleLabel(form.role)}</Text></Text>
                </Flex>

                <Dialog.Root open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                  <Dialog.Trigger>
                    <Button type="button" color="orange" variant="soft" style={{ width: '100%', fontWeight: 600 }}>
                      Сменить пароль
                    </Button>
                  </Dialog.Trigger>
                  <Dialog.Content maxWidth="440px">
                    <Dialog.Title>Смена пароля</Dialog.Title>
                    <Dialog.Description size="2" mb="3">
                      Введите ваш текущий пароль и новый пароль для защиты аккаунта
                    </Dialog.Description>
                    <form onSubmit={changePassword} className="form-root">
                      <Flex direction="column" gap="3">
                        <Flex direction="column" gap="2">
                          <Text size="2" weight="bold" color="gray">Текущий пароль *</Text>
                          <PasswordField
                            placeholder="Введите текущий пароль"
                            value={passwordForm.currentPassword}
                            onChange={(currentPassword) => setPasswordForm({ ...passwordForm, currentPassword })}
                            autoComplete="current-password"
                          />
                        </Flex>
                        <Flex direction="column" gap="2">
                          <Text size="2" weight="bold" color="gray">Новый пароль * (минимум 6 символов)</Text>
                          <PasswordField
                            placeholder="Введите новый пароль"
                            value={passwordForm.newPassword}
                            onChange={(newPassword) => setPasswordForm({ ...passwordForm, newPassword })}
                            minLength={6}
                            autoComplete="new-password"
                          />
                        </Flex>
                        <Flex direction="column" gap="2">
                          <Text size="2" weight="bold" color="gray">Подтверждение пароля *</Text>
                          <PasswordField
                            placeholder="Повторите новый пароль"
                            value={passwordForm.repeatPassword}
                            onChange={(repeatPassword) => setPasswordForm({ ...passwordForm, repeatPassword })}
                            minLength={6}
                            autoComplete="new-password"
                          />
                        </Flex>

                        {error && <Text color="red" size="2">{error}</Text>}

                        <Flex justify="end" gap="2">
                          <Dialog.Close>
                            <Button type="button" variant="soft">Отмена</Button>
                          </Dialog.Close>
                          <Button type="submit">Обновить пароль</Button>
                        </Flex>
                      </Flex>
                    </form>
                  </Dialog.Content>
                </Dialog.Root>
              </Flex>
            </Card>

            {/* Messages */}
            {error && (
              <Card style={{
                background: 'var(--red-2)',
                borderLeft: '3px solid var(--red-9)',
              }}>
                <Text color="red" size="2">{error}</Text>
              </Card>
            )}
            {success && (
              <Card style={{
                background: 'var(--green-2)',
                borderLeft: '3px solid var(--green-9)',
              }}>
                <Text color="green" size="2">{success}</Text>
              </Card>
            )}
          </Flex>

          {/* Right Column - My Ads */}
          <Flex direction="column" gap="4" style={{ flex: 1 }}>
            <Card>
              <Flex direction="column" gap="4">
                <Flex justify="between" align="center" wrap="wrap" gap="2">
                  <Flex gap="2" align="center">
                    <DescriptionIcon width={20} height={20} />
                    <Heading size="4" weight="bold" style={{margin:'0px'}}>Мои объявления ({myAds.length})</Heading>
                  </Flex>
                  <Button asChild size="2">
                    <a href="/create-ad" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><AddIcon width={18} height={18} /> Новое</a>
                  </Button>
                </Flex>

                {myAds.length === 0 ? (
                  <Card style={{
                    background: 'var(--gray-a2)',
                    textAlign: 'center',
                    padding: 'var(--space-4)',
                  }}>
                    <Flex direction="column" gap="3" align="center" justify="center">
                      <Text color="gray" weight="bold">У вас пока нет объявлений</Text>
                      <Text size="2" color="gray">Создайте первое объявление, чтобы помочь потерянным питомцам</Text>
                      <Button asChild>
                        <a href="/create-ad" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AddIcon width={18} height={18} /> Создать объявление</a>
                      </Button>
                      
                    </Flex>
                  </Card>
                ) : (
                  <Grid columns={{ initial: '1', md: '1', lg: '2' }} gap="3">
                    {myAds.map((ad) => (
                      <AdCard key={ad.id} ad={ad} showDescription />
                    ))}
                  </Grid>
                )}
              </Flex>
            </Card>
          </Flex>
        </Flex>
      </Container>

      <style>{`
        .checkbox {
          appearance: none;
          width: 20px;
          height: 20px;
          border: 2px solid var(--gray-a7);
          border-radius: 4px;
          cursor: pointer;
          background: white;
          transition: all 0.2s;
        }
        .checkbox:hover {
          border-color: var(--violet-8);
        }
        .checkbox[data-state="checked"] {
          background: var(--violet-8);
          border-color: var(--violet-8);
        }
        .checkbox-indicator {
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
      `}</style>
    </Flex>
  );
}
