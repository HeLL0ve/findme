# Настройка Gmail для отправки писем

## Шаг 1: Включить двухфакторную аутентификацию

Gmail требует 2FA для создания App Password. Если у тебя её нет:

1. Перейди на https://myaccount.google.com/security
2. Слева найди "Безопасность" (Security)
3. Прокрути вниз до "Двухэтапная аутентификация"
4. Нажми "Включить 2-этапную аутентификацию" и следуй инструкциям

## Шаг 2: Получить App Password

1. Перейди на https://myaccount.google.com/apppasswords
2. Если нужно, войди в свой Google аккаунт
3. Выбери:
   - **Select the app**: выбери "Mail"
   - **Select the device**: выбери "Windows Computer" (или твою ОС)
4. Gmail создаст пароль из **16 символов**

Пример: `abcd efgh ijkl mnop` (с пробелами)

## Шаг 3: Обновить .env файл

В файле `.env` в корне проекта найди:

```env
# Gmail config (для отправки писем через Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-16-digit-app-password
```

**Замени:**

- `your-email@gmail.com` → твой Gmail адрес (например: `john.doe@gmail.com`)
- `your-16-digit-app-password` → пароль из шага 2 (БЕЗ пробелов)

Пример после замены:

```env
GMAIL_USER=john.doe@gmail.com
GMAIL_PASSWORD=abcdefghijklmnop
```

## Шаг 4: Перезагрузи backend

1. Останови текущий процесс backend (Ctrl+C)
2. Запусти его заново:

```bash
cd backend
npm run dev
```

## Как это работает

Теперь когда приложение отправляет письмо:

1. Сначала пытается отправить через Gmail
2. Если Gmail не работает, пытается отправить через `MAIL_API_URL` (если указан)
3. Если ничего не работает, письма выводятся в логи backend

Письма будут отправляться **от адреса Gmail-аккаунта** (GMAIL_USER).

## Проверка

Когда пользователь регистрируется, проверь логи backend:

- Если письмо отправилось: увидишь "provider: gmail"
- Если провалилось: увидишь ошибку в логах

## Частые проблемы

### "App Password не создаётся"

- Убедись что 2FA включена
- Попробуй очистить кэш браузера и заново перейти на apppasswords

### "Invalid login or password"

- Проверь что пароль скопирован БЕЗ пробелов
- Убедись что GMAIL_USER правильный адрес

### "Less secure apps"

- Google блокирует обычные пароли для сторонних приложений
- **Обязательно используй App Password, а не обычный пароль!**

## Альтернатива: отключить Gmail

Если не хочешь использовать Gmail:

1. Оставь `GMAIL_USER` и `GMAIL_PASSWORD` пустыми:
   ```env
   GMAIL_USER=
   GMAIL_PASSWORD=
   ```
2. Используй `MAIL_API_URL` с другим сервисом (Brevo, SendGrid и т.д.) или просто смотри письма в логах backend
