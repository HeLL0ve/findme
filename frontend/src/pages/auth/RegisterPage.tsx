import { useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Dialog, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';
import { useAuthStore } from '../../shared/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    acceptTerms: false,
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.acceptTerms) {
      setError('Необходимо принять пользовательское соглашение');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/register', form);
      const loginResponse = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      });

      setAccessToken(loginResponse.data.accessToken);
      try {
        const me = await api.get('/users/me');
        setUser(me.data);
      } catch {
        setUser(loginResponse.data.user ?? null);
      }

      navigate('/');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Ошибка регистрации'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container size="2">
      <Card>
        <Heading size="7">Создать аккаунт</Heading>
        <form onSubmit={submit} className="form-root" style={{ marginTop: 16 }}>
          <Flex direction="column" gap="3">
            <TextField.Root
              placeholder="Имя (необязательно)"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <TextField.Root
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
            <TextField.Root
              type="password"
              placeholder="Пароль"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
              minLength={6}
            />

            <Flex align="start" gap="2">
              <Checkbox.Root
                id="acceptTerms"
                className="checkbox"
                checked={form.acceptTerms}
                onCheckedChange={(value) => setForm({ ...form, acceptTerms: Boolean(value) })}
              >
                <Checkbox.Indicator className="checkbox-indicator">✓</Checkbox.Indicator>
              </Checkbox.Root>
              <label htmlFor="acceptTerms" style={{ lineHeight: 1.4 }}>
                Я принимаю{' '}
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--accent)',
                    padding: 0,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    font: 'inherit',
                  }}
                >
                  условия использования
                </button>{' '}
                и политику обработки персональных данных.
              </label>
            </Flex>

            {error && <Text color="red">{error}</Text>}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
            <Text size="2" color="gray">
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </Text>
          </Flex>
        </form>
      </Card>

      <Dialog.Root open={termsOpen} onOpenChange={setTermsOpen}>
        <Dialog.Content maxWidth="720px">
          <Dialog.Title>Условия использования FindMe</Dialog.Title>
          <Dialog.Description size="2">
            Пожалуйста, внимательно прочитайте основные условия перед регистрацией.
          </Dialog.Description>

          <div style={{ maxHeight: 420, overflow: 'auto', marginTop: 12, paddingRight: 6 }}>
            <Text as="p" size="2">
              1. Сервис FindMe предназначен для публикации объявлений о потерянных и найденных домашних животных,
              общения пользователей и координации поиска.
            </Text>
            <Text as="p" size="2">
              2. Пользователь обязуется указывать достоверную информацию в объявлениях и не размещать ложные данные,
              спам, оскорбления или контент, нарушающий законодательство.
            </Text>
            <Text as="p" size="2">
              3. Загружаемые фотографии и тексты должны принадлежать пользователю или использоваться им на законных
              основаниях. Ответственность за содержание публикаций несет пользователь.
            </Text>
            <Text as="p" size="2">
              4. Администрация имеет право модерировать объявления, отклонять публикации, ограничивать доступ и
              рассматривать жалобы.
            </Text>
            <Text as="p" size="2">
              5. Пользователь соглашается на обработку персональных данных (email, имя, контактный номер, username
              Telegram и другие данные профиля) для обеспечения работы сервиса и уведомлений.
            </Text>
            <Text as="p" size="2">
              6. Сервис не гарантирует обязательного результата поиска животного, но предоставляет технические
              инструменты для поиска и взаимодействия участников.
            </Text>
            <Text as="p" size="2">
              7. В чатах запрещены угрозы, дискриминация, мошенничество и распространение вредоносных ссылок.
            </Text>
            <Text as="p" size="2">
              8. При регистрации пользователь подтверждает, что ознакомился с этими условиями и принимает их полностью.
            </Text>
          </div>

          <Flex justify="end" mt="4">
            <Dialog.Close>
              <Button type="button">Понятно</Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Container>
  );
}
