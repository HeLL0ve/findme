# FindMe — поиск потерянных питомцев

Платформа для поиска потерянных и найденных домашних животных. Пользователи могут размещать объявления, общаться в чатах, получать уведомления через браузер и Telegram.

## Стек

**Backend:** Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL, Redis, WebSocket (ws), Passport.js (Google OAuth), Nodemailer, Telegram Bot API

**Frontend:** React 19, TypeScript, Vite, Radix UI, Zustand, React Router, Leaflet, Recharts, Axios

**Инфраструктура:** Docker, Docker Compose

---

## Быстрый старт через Docker

```bash
cp .env.example .env   # заполни переменные
docker-compose up --build
```

Приложение будет доступно:
- Фронтенд: http://localhost:5173
- Бэкенд API: http://localhost:3000

### Запустить только базы данных (для локальной разработки)

```bash
docker-compose up postgres redis
```

### Запустить только бэкенд и фронтенд в контейнерах

```bash
docker-compose up frontend backend
```

---

## Локальная разработка

### Требования

- Node.js 20+
- Docker (для PostgreSQL и Redis)

### Установка

```bash
npm install
```

### Запуск баз данных

```bash
docker-compose up postgres redis
```

### Применить миграции

```bash
cd backend
npx prisma migrate deploy
```

### Запуск dev-серверов

```bash
npm run dev
```

Запускает бэкенд и фронтенд одновременно через `concurrently`.

### Prisma Studio

```bash
cd backend
npx prisma studio --config ./prisma.config.ts
```

### Миграция внутри Docker-контейнера

```bash
docker-compose exec backend npx prisma migrate dev
```

---

## Переменные окружения

Создай `.env` в корне проекта на основе примера ниже.

```env
# PostgreSQL
POSTGRES_USER=findme
POSTGRES_PASSWORD=secret
POSTGRES_DB=findme_db
DATABASE_URL=postgresql://findme:secret@localhost:5432/findme_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# URLs
CLIENT_ORIGIN=http://localhost:5173
APP_URL=http://localhost:5173
PUBLIC_API_URL=http://localhost:3000

# Gmail (опционально)
GMAIL_USER=your@gmail.com
GMAIL_PASSWORD=your_app_password
MAIL_BRAND_NAME=FindMe

# Google OAuth (опционально)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Telegram Bot (опционально)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHANNEL_ID=
TELEGRAM_BOT_USERNAME=
```

---

## Структура проекта

```
findme/
├── backend/                # Express API
│   ├── prisma/             # Схема БД и миграции
│   ├── src/
│   │   ├── modules/        # Модули (auth, ads, chats, ...)
│   │   ├── shared/         # Общие утилиты и ошибки
│   │   ├── ws/             # WebSocket сервер
│   │   └── app.ts          # Express приложение
│   └── uploads/            # Загруженные файлы (не в git)
├── frontend/               # React приложение
│   ├── public/             # Статические файлы
│   └── src/
│       ├── app/            # App, Header, Footer, роутинг
│       ├── components/     # Переиспользуемые компоненты
│       ├── pages/          # Страницы
│       └── shared/         # Хуки, стор, утилиты
├── docker-compose.yml
└── .env
```

---

## Основные возможности

- Регистрация и вход (email/пароль, Google OAuth)
- Подтверждение email, сброс пароля
- Создание объявлений о потерянных/найденных питомцах с фото и геолокацией
- Модерация объявлений администратором
- Чаты между пользователями в реальном времени (WebSocket)
- Уведомления в браузере и через Telegram
- Избранное (localStorage)
- Счётчик просмотров объявлений
- Фильтрация по дате, типу, городу
- Карта объявлений (Leaflet)
- Жалобы на объявления и пользователей
- Поддержка пользователей через чат с администратором
- Публикация одобренных объявлений в Telegram-канал
- Административная панель со статистикой и аналитикой

---

## Дополнительные руководства

- [Настройка Gmail](./GMAIL_SETUP.md)
- [Настройка Google OAuth](./GOOGLE_AUTH_SETUP.md)
- [Cloudflare Tunnel для Telegram и Google OAuth](./CLOUDFLARED_TELEGRAM_SETUP.md)
