import { useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Dialog, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';
import { AuthShell } from './AuthShell';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    acceptTerms: false,
  });

  function validate() {
    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password;

    if (!name) return 'Введите имя';
    // Basic email sanity check (HTML validation is helpful but not always triggered, e.g. autofill)
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return 'Введите корректный email';
    if (!password || password.length < 6) return 'Пароль должен быть не менее 6 символов';
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
        ...form,
        email: form.email.trim(),
        name: form.name.trim(),
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
          <TextField.Root
            type="password"
            placeholder="Пароль (минимум 6 символов)"
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
          <div className="auth-links">
            <Text size="2" color="gray">
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </Text>
          </div>
        </Flex>
      </form>

      <Dialog.Root open={termsOpen} onOpenChange={setTermsOpen}>
        <Dialog.Content maxWidth="720px" style={{ maxHeight: '80vh', overflow: 'auto' }}>
          <Dialog.Title>Условия использования FindMe</Dialog.Title>
          <Flex direction="column" gap="3" style={{ marginTop: 16, lineHeight: 1.6 }}>
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

          <Flex justify="end" mt="4" gap="2">
            <Dialog.Close>
              <Button type="button" variant="soft">Отклонить</Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button type="button">Принять</Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </AuthShell>
  );
}
