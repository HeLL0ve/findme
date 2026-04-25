import { useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Dialog, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';
import { AuthShell } from './AuthShell';
import { PasswordField } from '../../components/common/PasswordField';
import { usePageTitle } from '../../shared/usePageTitle';
import { GoogleAuthButton } from '../../components/common/GoogleAuthButton';

export default function RegisterPage() {
  usePageTitle('Регистрация');
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    repeatPassword: '',
    name: '',
    acceptTerms: false,
  });

  function validate() {
    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password;
    const repeatPassword = form.repeatPassword;

    if (!name) return 'Введите имя';
    // Basic email sanity check (HTML validation is helpful but not always triggered, e.g. autofill)
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return 'Введите корректный email';
    if (!password || password.length < 6) return 'Пароль должен быть не менее 6 символов';
    if (password !== repeatPassword) return 'Пароли не совпадают';
    if (!form.acceptTerms) return 'Необходимо принять пользовательское соглашение';
    return null;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) return void setError(validationError);

    setSubmitting(true);
    try {
      await api.post('/auth/register', {
        email: form.email.trim(),
        name: form.name.trim(),
        password: form.password,
        acceptTerms: form.acceptTerms,
      });
      navigate(`/login?registered=1&email=${encodeURIComponent(form.email.trim())}`);
    } catch (err) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      const message = extractApiErrorMessage(err, 'Ошибка регистрации');
      if (code === 'INVALID_CREDENTIALS') {
        setError('Проверьте email и пароль');
      } else {
        setError(/token/i.test(message) ? 'Проверьте email и пароль' : message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Создать аккаунт"
      subtitle="Регистрация займет минуту. После — подтвердите email."
      kicker="Регистрация"
      tone="green"
    >
      <form onSubmit={submit} className="form-root">
        <Flex direction="column" gap="3">
          <TextField.Root
            placeholder="Имя *"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <TextField.Root
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <PasswordField
            placeholder="Пароль (минимум 6 символов)"
            value={form.password}
            onChange={(password) => setForm({ ...form, password })}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <PasswordField
            placeholder="Повторите пароль"
            value={form.repeatPassword}
            onChange={(repeatPassword) => setForm({ ...form, repeatPassword })}
            required
            minLength={6}
            autoComplete="new-password"
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
                    color: 'var(--accent-11)',
                    padding: 0,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    font: 'inherit',
                  }}
                >
                  условия использования
                </button>
                .
              </label>
            </Flex>

          {error && (
            <div className="auth-alert auth-alert--error">
              <Text color="red" size="2">
                {error}
              </Text>
            </div>
          )}

          <Button type="submit" disabled={submitting} style={{ fontWeight: 700 }}>
            {submitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--gray-a5)' }} />
            <Text size="1" color="gray">или</Text>
            <div style={{ flex: 1, height: 1, background: 'var(--gray-a5)' }} />
          </div>

          <GoogleAuthButton label="Зарегистрироваться через Google" />
          <div className="auth-links">
            <Text size="2" color="gray">
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </Text>
          </div>
        </Flex>
      </form>

      <Dialog.Root open={termsOpen} onOpenChange={setTermsOpen}>
        <Dialog.Content
          maxWidth="760px"
          style={{
            padding: 0,
            overflow: 'hidden',
            borderRadius: 18,
            border: '1px solid var(--gray-a6)',
            background:
              'linear-gradient(180deg, color-mix(in oklab, var(--surface) 92%, var(--accent-soft)), var(--surface))',
            boxShadow: '0 28px 80px rgba(0,0,0,0.22), 0 6px 18px rgba(0,0,0,0.12)',
          }}
        >
          <div
            style={{
              padding: '18px 20px 14px',
              borderBottom: '1px solid var(--gray-a5)',
              background:
                'linear-gradient(135deg, color-mix(in oklab, var(--green-a3) 45%, transparent), transparent 55%)',
            }}
          >
            <Text as="div" size="2" style={{ marginBottom: 8 }}>
              <span className="auth-kicker" style={{ ['--auth-kicker-bg' as never]: 'var(--green-a3)', ['--auth-kicker-border' as never]: 'var(--green-a6)', ['--auth-kicker-text' as never]: 'var(--green-11)' }}>
                Пользовательское соглашение
              </span>
            </Text>
            <Dialog.Title style={{ margin: 0 }}>Условия использования FindMe</Dialog.Title>
            <Dialog.Description size="2" color="gray" style={{ marginTop: 6 }}>
              Пожалуйста, ознакомьтесь с условиями. Нажимая «Принять», вы соглашаетесь с ними и сможете продолжить регистрацию.
            </Dialog.Description>
          </div>

          <div style={{ maxHeight: '62vh', overflow: 'auto', padding: 18 }}>
            <div
              style={{
                border: '1px solid var(--gray-a5)',
                borderRadius: 14,
                background: 'var(--gray-a2)',
                padding: 16,
              }}
            >
              <Flex direction="column" gap="3" style={{ lineHeight: 1.65 }}>
            <div>
              <Heading size="4" mb="2">1. Общие положения</Heading>
              <Text as="div" size="2">
                FindMe — сервис для поиска потерянных и найденных домашних животных. Регистрируясь на сервисе, вы принимаете настоящие условия использования в полном объеме.
              </Text>
            </div>

            <div>
              <Heading size="4" mb="2">2. Ответственность пользователей</Heading>
              <Text as="div" size="2">
                Пользователи несут полную ответственность за информацию, размещаемую в своих объявлениях. Запрещается публиковать:
              </Text>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li><Text as="span" size="2">Ложную, оскорбительную или незаконную информацию</Text></li>
                <li><Text as="span" size="2">Контент, нарушающий права третьих лиц</Text></li>
                <li><Text as="span" size="2">Объявления о животных без согласия их владельца</Text></li>
                <li><Text as="span" size="2">Коммерческие предложения и спам</Text></li>
              </ul>
            </div>

            <div>
              <Heading size="4" mb="2">3. Защита данных</Heading>
              <Text as="div" size="2">
                Ваша личная информация хранится в соответствии с принципами конфиденциальности. Мы не передаем данные третьим лицам без вашего согласия, кроме случаев, требуемых законодательством.
              </Text>
            </div>

            <div>
              <Heading size="4" mb="2">4. Правила моральной ответственности</Heading>
              <Text as="div" size="2">
                При общении с другими пользователями проявляйте уважение и честность. Сообщайте достоверную информацию о питомцах и помогите другим найти их любимцев.
              </Text>
            </div>

            <div>
              <Heading size="4" mb="2">5. Модерация и санкции</Heading>
              <Text as="div" size="2">
                Администрация вправе удалять нарушающий контент и блокировать аккаунты, нарушающие условия использования. Жалобы на нарушения рассматриваются в течение 24-48 часов.
              </Text>
            </div>

            <div>
              <Heading size="4" mb="2">6. Ограничение ответственности</Heading>
              <Text as="div" size="2">
                FindMe предоставляет сервис "как есть". Мы не гарантируем нахождение потерянного животного и не несем ответственность за результаты взаимодействия пользователей.
              </Text>
            </div>

            <div>
              <Heading size="4" mb="2">7. Изменение условий</Heading>
              <Text as="div" size="2">
                FindMe оставляет право изменять настоящие условия. Уведомление об изменениях будет направлено на адрес электронной почты, указанный при регистрации.
              </Text>
            </div>

            <div>
              <Heading size="4" mb="2">8. Контакты</Heading>
              <Text as="div" size="2">
                По вопросам соблюдения условий пишите на support@findme.local
              </Text>
            </div>
              </Flex>
            </div>
          </div>

          <div
            style={{
              padding: '14px 18px',
              borderTop: '1px solid var(--gray-a5)',
              background: 'color-mix(in oklab, var(--surface) 90%, var(--accent-soft))',
            }}
          >
            <Flex justify="between" align="center" gap="3" wrap="wrap">
              <Text size="2" color="gray">
                Статус: <Text as="span" weight="bold" color={form.acceptTerms ? 'green' : 'gray'}>{form.acceptTerms ? 'принято' : 'не принято'}</Text>
              </Text>
              <Flex justify="end" gap="2">
                <Button
                  type="button"
                  variant="soft"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, acceptTerms: false }));
                    setTermsOpen(false);
                  }}
                >
                  Отклонить
                </Button>
                <Button
                  type="button"
                  style={{ fontWeight: 700 }}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, acceptTerms: true }));
                    setTermsOpen(false);
                  }}
                >
                  Принять
                </Button>
              </Flex>
            </Flex>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </AuthShell>
  );
}
