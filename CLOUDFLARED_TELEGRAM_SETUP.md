# Cloudflared For Telegram Buttons

Эта инструкция нужна для локального тестирования Telegram-кнопок без деплоя.

Идея простая:
- backend публикуется наружу через `cloudflared`;
- frontend публикуется наружу через `cloudflared`;
- Telegram получает публичную ссылку на frontend и может показать inline-кнопку;
- при этом обычные `.env` файлы не меняются, всё делается временно в отдельных PowerShell-окнах.

Если закрыть окна с туннелями и dev-серверами, проект вернется в обычный локальный режим.

## Что важно заранее

- Эта схема не ломает текущее приложение, если не переписывать `.env`.
- Все переменные ниже задаются только в текущем окне PowerShell через `$env:...`.
- Для Telegram-кнопок `localhost` не подходит. Нужен публичный `https://...trycloudflare.com`.
- Quick tunnel живет только пока открыто окно `cloudflared`.

## 1. Установить cloudflared

Открой PowerShell:

```powershell
winget install --id Cloudflare.cloudflared
```

Проверка:

```powershell
cloudflared --version
```

## 2. Поднять туннель для backend

Открой отдельное окно PowerShell:

```powershell
cloudflared tunnel --url http://localhost:3000
```

В выводе появится ссылка вида:

```text
https://api-name.trycloudflare.com
```

Скопируй ее. Ниже я буду называть ее `API_TUNNEL_URL`.

## 3. Запустить frontend через tunnel backend

Открой новое окно PowerShell в корне проекта:

```powershell
$env:VITE_API_URL="https://api-name.trycloudflare.com"
$env:VITE_WS_URL="wss://api-name.trycloudflare.com/ws"
npm run dev -w frontend
```

Важно:
- вместо `https://api-name.trycloudflare.com` подставь свой `API_TUNNEL_URL`;
- это не меняет `frontend/.env`.

## 4. Поднять туннель для frontend

Открой еще одно окно PowerShell:

```powershell
cloudflared tunnel --url http://localhost:5173
```

Появится ссылка вида:

```text
https://front-name.trycloudflare.com
```

Скопируй ее. Ниже я буду называть ее `FRONT_TUNNEL_URL`.

## 5. Запустить backend с публичными URL

Открой еще одно окно PowerShell в корне проекта:

```powershell
$env:CLIENT_ORIGIN="https://front-name.trycloudflare.com"
$env:APP_URL="https://front-name.trycloudflare.com"
$env:PUBLIC_API_URL="https://api-name.trycloudflare.com"
npm run dev -w backend
```

Важно:
- вместо `https://front-name.trycloudflare.com` подставь свой `FRONT_TUNNEL_URL`;
- вместо `https://api-name.trycloudflare.com` подставь свой `API_TUNNEL_URL`;
- это не меняет `backend/.env`.

## 6. Что должно быть открыто одновременно

Во время теста должны работать 4 окна:

1. `cloudflared` для backend
2. `frontend` dev server
3. `cloudflared` для frontend
4. `backend` dev server

Если закрыть любое окно с туннелем, публичная ссылка перестанет работать.

## 7. Как тестировать

1. Открой `FRONT_TUNNEL_URL` в браузере.
2. Войди в приложение.
3. Создай или одобри объявление.
4. Проверь сообщение в Telegram.
5. Inline-кнопка должна вести на `FRONT_TUNNEL_URL`.

## 8. Как быстро вернуться к обычной локальной работе

Просто закрой:
- оба окна `cloudflared`;
- окно `frontend`;
- окно `backend`.

После этого запусти как обычно:

```powershell
npm run dev
```

Никакие `.env` файлы вручную откатывать не нужно, если ты не менял их сам.

## 9. Готовый шаблон команд

Подставь реальные URL из вывода `cloudflared`.

### Команда для frontend

```powershell
$env:VITE_API_URL="API_TUNNEL_URL"
$env:VITE_WS_URL="API_TUNNEL_URL/ws"
$env:VITE_WS_URL=$env:VITE_WS_URL.Replace("https://","wss://").Replace("http://","ws://")
npm run dev -w frontend
```

### Команда для backend

```powershell
$env:CLIENT_ORIGIN="FRONT_TUNNEL_URL"
$env:APP_URL="FRONT_TUNNEL_URL"
$env:PUBLIC_API_URL="API_TUNNEL_URL"
npm run dev -w backend
```

## 10. Частые проблемы

### Telegram не показывает inline-кнопку

Причины:
- в `APP_URL` остался `localhost`;
- туннель frontend уже умер;
- в Telegram пришло старое сообщение, отправленное до запуска tunnel.

Что проверить:
- `APP_URL` должен быть `https://...trycloudflare.com`;
- frontend tunnel должен быть жив;
- отправь новое уведомление или заново одобри объявление.

### Сообщения приходят, но переход не открывается

Причины:
- frontend tunnel уже закрыт;
- ссылка устарела, потому что `trycloudflare.com` адрес сменился после нового запуска.

Что делать:
- заново поднять оба туннеля;
- заново перезапустить backend и frontend с новыми URL.

### Не работает логин после перезапуска

Это нормально для временной tunnel-схемы.

Что делать:
- просто войти заново;
- если нужно, очистить `localStorage` в браузере для tunnel-домена.

## 11. Самый безопасный режим использования

Для обычной разработки используй старый режим:

```powershell
npm run dev
```

Эту `cloudflared`-схему включай только когда нужно проверить:
- inline-кнопки в Telegram;
- переходы из Telegram в объявление;
- переходы из Telegram в чат;
- внешний доступ с телефона или другого устройства.
